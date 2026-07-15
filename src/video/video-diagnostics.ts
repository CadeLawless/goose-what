export function logVideoDiagnostic(stage: string, details: Record<string, unknown> = {}) {
  if (!__DEV__) return;
  console.info(`[RoundVideo] ${stage}`, details);
}

export function warnVideoDiagnostic(
  stage: string,
  error: unknown,
  details: Record<string, unknown> = {},
) {
  if (!__DEV__) return;
  console.warn(`[RoundVideo] ${stage}`, {
    ...details,
    error: error instanceof Error ? error.message : String(error),
  });
}
