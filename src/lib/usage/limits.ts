export const DAILY_TRANSCRIPTION_LIMIT = 10;
export const MAX_AUDIO_FILE_SIZE_MB = 50;
export const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;

export function getRemainingTranscriptions(usedToday: number): number {
  return Math.max(0, DAILY_TRANSCRIPTION_LIMIT - usedToday);
}

export function buildUsageMessage(usedToday: number): string {
  const remaining = getRemainingTranscriptions(usedToday);
  if (remaining === 0) {
    return "Has alcanzado el limite diario de transcripciones. Vuelve manana.";
  }
  if (remaining === 1) return "Te queda 1 transcripcion hoy.";
  return `Te quedan ${remaining} transcripciones hoy.`;
}
