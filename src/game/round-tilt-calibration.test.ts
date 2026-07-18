import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  clearRoundTiltCalibration,
  getRecentRoundTiltCalibration,
  rememberRoundTiltCalibration,
} from './round-tilt-calibration';

describe('round tilt calibration handoff', () => {
  afterEach(clearRoundTiltCalibration);

  it('reuses a baseline captured on the ready screen', () => {
    rememberRoundTiltCalibration(0.42, 1_000);

    assert.deepEqual(getRecentRoundTiltCalibration(1_250), {
      baseline: 0.42,
      capturedAt: 1_000,
      ageMs: 250,
    });
  });

  it('rejects a stale baseline from an earlier round', () => {
    rememberRoundTiltCalibration(0.42, 1_000);

    assert.equal(getRecentRoundTiltCalibration(11_001), null);
  });

  it('can be cleared when forehead placement is lost', () => {
    rememberRoundTiltCalibration(0.42, 1_000);
    clearRoundTiltCalibration();

    assert.equal(getRecentRoundTiltCalibration(1_250), null);
  });
});
