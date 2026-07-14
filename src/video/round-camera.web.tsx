import { forwardRef } from 'react';

import type { RoundCameraRef } from './round-camera';

export async function requestRoundCameraPermissions() {
  return false;
}

export const RoundCamera = forwardRef<RoundCameraRef, { enabled: boolean }>(
  function RoundCamera() {
    return null;
  },
);
