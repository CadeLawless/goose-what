import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

import { getRecentRoundTiltCalibration } from '@/game/round-tilt-calibration';
import type { TiltAction } from '@/game/tilt-detector';
import {
  createTiltDetectorState,
  normalizePortraitCanvasTilt,
  updateTiltDetector,
} from '@/game/tilt-detector';
import { logRoundDiagnostic, warnRoundDiagnostic } from '@/video/video-diagnostics';

export type TiltControlStatus = 'checking' | 'calibrating' | 'ready' | 'unavailable' | 'denied';

type UseTiltControlsOptions = {
  enabled: boolean;
  acceptingInput: boolean;
  onAction: (action: TiltAction) => void;
  onRearmed: () => void;
};

export function useTiltControls({ enabled, acceptingInput, onAction, onRearmed }: UseTiltControlsOptions) {
  const [status, setStatus] = useState<TiltControlStatus>('checking');
  const detector = useRef(createTiltDetectorState());
  const acceptingInputRef = useRef(acceptingInput);
  const onActionRef = useRef(onAction);
  const onRearmedRef = useRef(onRearmed);

  useLayoutEffect(() => {
    acceptingInputRef.current = acceptingInput;
    onActionRef.current = onAction;
    onRearmedRef.current = onRearmed;
  }, [acceptingInput, onAction, onRearmed]);

  useEffect(() => {
    logRoundDiagnostic('tilt input acceptance changed', { acceptingInput, enabled });
  }, [acceptingInput, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

    const connect = async () => {
      const connectStartedAt = Date.now();
      setStatus('checking');
      detector.current = createTiltDetectorState();

      // Browser support varies widely and some Expo web implementations report
      // availability without exposing the listener API. The web MVP therefore
      // uses the reliable button controls and reserves tilt input for native apps.
      if (Platform.OS === 'web') {
        setStatus('unavailable');
        logRoundDiagnostic('tilt controls unavailable on web');
        return;
      }

      const available = await DeviceMotion.isAvailableAsync().catch(() => false);
      if (!active) return;
      if (!available) {
        setStatus('unavailable');
        warnRoundDiagnostic('tilt controls unavailable', new Error('DeviceMotion unavailable'));
        return;
      }

      const currentPermission = await DeviceMotion.getPermissionsAsync().catch(() => null);
      let granted = currentPermission?.granted ?? true;
      if (!granted && currentPermission?.canAskAgain) {
        const requested = await DeviceMotion.requestPermissionsAsync().catch(() => null);
        granted = requested?.granted ?? false;
      }
      if (!active) return;
      if (!granted) {
        setStatus('denied');
        warnRoundDiagnostic('tilt controls permission denied', new Error('DeviceMotion denied'));
        return;
      }

      DeviceMotion.setUpdateInterval(50);
      const recentCalibration = getRecentRoundTiltCalibration();
      if (recentCalibration) {
        detector.current = createTiltDetectorState(recentCalibration.baseline);
        setStatus('ready');
        logRoundDiagnostic('tilt controls reused ready-screen baseline', {
          baseline: recentCalibration.baseline,
          baselineAgeMs: recentCalibration.ageMs,
          connectElapsedMs: Date.now() - connectStartedAt,
        });
      } else {
        setStatus('calibrating');
        logRoundDiagnostic('tilt controls started fallback calibration', {
          connectElapsedMs: Date.now() - connectStartedAt,
          updateIntervalMs: 50,
        });
      }
      try {
        subscription = DeviceMotion.addListener((measurement) => {
          // Ready/Game remain portrait-locked at the native level and rotate their
          // canvas visually. DeviceMotion.orientation therefore cannot determine
          // whether these screens are being used in landscape.
          const angle = normalizePortraitCanvasTilt(measurement.rotation.gamma);
          const result = updateTiltDetector(
            detector.current,
            angle,
            undefined,
            acceptingInputRef.current,
          );
          detector.current = result.state;

          if (result.calibrated) {
            setStatus((current) => {
              if (current === 'ready') return current;
              logRoundDiagnostic('tilt controls fallback calibration completed', {
                baseline: result.state.baseline,
                connectElapsedMs: Date.now() - connectStartedAt,
                sampleCount: result.state.calibrationCount,
              });
              return 'ready';
            });
          }
          if (result.action && acceptingInputRef.current) {
            logRoundDiagnostic('tilt action detected', {
              action: result.action,
              delta: result.delta,
              elapsedSinceConnectMs: Date.now() - connectStartedAt,
            });
            onActionRef.current(result.action);
          }
          if (result.rearmed) {
            logRoundDiagnostic('tilt controls rearmed', {
              delta: result.delta,
              elapsedSinceConnectMs: Date.now() - connectStartedAt,
            });
            onRearmedRef.current();
          }
        });
      } catch (error) {
        setStatus('unavailable');
        warnRoundDiagnostic('tilt controls listener failed', error);
      }
    };

    connect();
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [enabled]);

  return status;
}
