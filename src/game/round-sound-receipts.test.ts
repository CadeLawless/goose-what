import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createPendingRoundSoundCue,
  finalizeRoundSoundReceipts,
} from '../video/round-sound-receipts';

describe('round sound playback receipts', () => {
  it('keeps only cues confirmed audible for export', () => {
    const audible = { ...createPendingRoundSoundCue('1', 'correct', 1_250, 1_000), wasAudible: true };
    const silent = { ...createPendingRoundSoundCue('2', 'pass', 1_500, 1_000), wasAudible: false };
    const pending = createPendingRoundSoundCue('3', 'flip', 1_750, 1_000);

    assert.deepEqual(finalizeRoundSoundReceipts([audible, silent, pending]), {
      audibleCues: [{ atMs: 250, sound: 'correct' }],
      excludedCueCount: 2,
      pendingCueCount: 1,
      requestedCueCount: 3,
    });
  });

  it('anchors cue timing to the request rather than the later playback result', () => {
    assert.deepEqual(createPendingRoundSoundCue('cue', 'round-start', 5_025, 5_000), {
      atMs: 25,
      requestId: 'cue',
      sound: 'round-start',
    });
  });

  it('clamps requests made before recording start to the beginning', () => {
    assert.equal(createPendingRoundSoundCue('cue', 'get-ready', 999, 1_000).atMs, 0);
  });
});
