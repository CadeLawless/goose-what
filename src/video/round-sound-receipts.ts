import type { RoundSoundId, RoundVideoSoundCue } from '@/video/round-sounds';

export type PendingRoundVideoSoundCue = RoundVideoSoundCue & {
  requestId: string;
  wasAudible?: boolean;
};

export function finalizeRoundSoundReceipts(cues: PendingRoundVideoSoundCue[]) {
  const audibleCues = cues
    .filter((cue) => cue.wasAudible === true)
    .map<RoundVideoSoundCue>(({ atMs, sound }) => ({ atMs, sound }));

  return {
    audibleCues,
    excludedCueCount: cues.length - audibleCues.length,
    pendingCueCount: cues.filter((cue) => cue.wasAudible === undefined).length,
    requestedCueCount: cues.length,
  };
}

export function createPendingRoundSoundCue(
  requestId: string,
  sound: RoundSoundId,
  requestedAt: number,
  recordingStartedAt: number,
): PendingRoundVideoSoundCue {
  return {
    atMs: Math.max(0, requestedAt - recordingStartedAt),
    requestId,
    sound,
  };
}
