type RoundTiltCalibration = {
  baseline: number;
  capturedAt: number;
};

const MAX_CALIBRATION_AGE_MS = 10_000;
let latestCalibration: RoundTiltCalibration | null = null;

export function rememberRoundTiltCalibration(baseline: number, capturedAt = Date.now()) {
  if (!Number.isFinite(baseline)) return;
  latestCalibration = { baseline, capturedAt };
}

export function clearRoundTiltCalibration() {
  latestCalibration = null;
}

export function getRecentRoundTiltCalibration(now = Date.now()) {
  if (!latestCalibration) return null;
  const ageMs = Math.max(0, now - latestCalibration.capturedAt);
  if (ageMs > MAX_CALIBRATION_AGE_MS) return null;
  return { ...latestCalibration, ageMs };
}
