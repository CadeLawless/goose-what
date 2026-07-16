import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export type OrientationLayoutTarget = 'landscape' | 'portrait';

type LayoutSize = { height: number; width: number };

type PendingLayout = {
  resolve: (settled: boolean) => void;
  scheduled: boolean;
  target: OrientationLayoutTarget;
  timeout: ReturnType<typeof setTimeout>;
};

const LAYOUT_TIMEOUT_MS = 2_500;

function matchesTarget(size: LayoutSize, target: OrientationLayoutTarget) {
  return target === 'landscape' ? size.width > size.height : size.height > size.width;
}

function afterPaint(callback: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

export function useOrientationLayoutWaiter() {
  const latestSize = useRef<LayoutSize | null>(null);
  const pending = useRef<PendingLayout | null>(null);

  const resolvePending = useCallback((settled: boolean) => {
    const current = pending.current;
    if (!current) return;
    clearTimeout(current.timeout);
    pending.current = null;
    current.resolve(settled);
  }, []);

  const scheduleResolutionIfReady = useCallback(
    (size: LayoutSize) => {
      const current = pending.current;
      if (!current || current.scheduled || !matchesTarget(size, current.target)) return;
      current.scheduled = true;
      afterPaint(() => {
        const latest = latestSize.current;
        const waiting = pending.current;
        if (!latest || !waiting || !matchesTarget(latest, waiting.target)) {
          if (waiting) waiting.scheduled = false;
          return;
        }
        resolvePending(true);
      });
    },
    [resolvePending],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, width } = event.nativeEvent.layout;
      const size = { height, width };
      latestSize.current = size;
      scheduleResolutionIfReady(size);
    },
    [scheduleResolutionIfReady],
  );

  const waitForLayout = useCallback(
    (target: OrientationLayoutTarget) => {
      resolvePending(false);
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolvePending(false), LAYOUT_TIMEOUT_MS);
        pending.current = { resolve, scheduled: false, target, timeout };
        if (latestSize.current) scheduleResolutionIfReady(latestSize.current);
      });
    },
    [resolvePending, scheduleResolutionIfReady],
  );

  useEffect(() => () => resolvePending(false), [resolvePending]);

  return { onLayout, waitForLayout };
}
