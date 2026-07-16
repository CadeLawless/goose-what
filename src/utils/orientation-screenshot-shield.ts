import type { RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';

import {
  beginOrientationScreenshotShield,
  finishOrientationScreenshotShield,
  supportsOrientationScreenshotShield,
} from 'whatz-it-video-export';

import type { OrientationLayoutTarget } from '@/hooks/use-orientation-layout-waiter';
import { lockLandscapeOrientation, lockPortraitOrientation } from '@/utils/orientation';

export type ScreenOrientationOption = 'portrait' | 'landscape_right';

type ChangeOrientationWithScreenshotShieldOptions = {
  screenRef: RefObject<View | null>;
  setScreenOrientation: (orientation: ScreenOrientationOption) => void;
  target: 'landscape' | 'portrait';
  waitForLayout: (target: OrientationLayoutTarget) => Promise<boolean>;
};

function waitForShieldPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function changeOrientationWithScreenshotShield({
  screenRef,
  setScreenOrientation,
  target,
  waitForLayout,
}: ChangeOrientationWithScreenshotShieldOptions) {
  if (Platform.OS === 'web') return true;

  let snapshotUri: string | null = null;
  let shieldActive = false;

  if (Platform.OS === 'ios' && supportsOrientationScreenshotShield()) {
    snapshotUri = await captureRef(screenRef, {
      format: 'png',
      result: 'tmpfile',
    }).catch(() => null);
    shieldActive = await beginOrientationScreenshotShield(snapshotUri).catch(() => false);
    if (snapshotUri) releaseCapture(snapshotUri);
    if (shieldActive) await waitForShieldPaint();
  }

  const layoutSettled = waitForLayout(target);
  try {
    setScreenOrientation(target === 'landscape' ? 'landscape_right' : 'portrait');
    const orientationApplied = target === 'landscape'
      ? await lockLandscapeOrientation()
      : await lockPortraitOrientation();
    const layoutApplied = await layoutSettled;
    return orientationApplied && layoutApplied;
  } finally {
    if (shieldActive) {
      await finishOrientationScreenshotShield().catch(() => false);
    }
  }
}
