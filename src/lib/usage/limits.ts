export const DAILY_TRANSCRIPTION_LIMIT = 10;
export const MAX_AUDIO_FILE_SIZE_MB = 10;
export const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
export const MAX_AUDIO_DURATION_MINUTES = 3;
export const MAX_AUDIO_DURATION_SECONDS = MAX_AUDIO_DURATION_MINUTES * 60;

// El cliente detiene la grabación 10 s antes del límite duro del servicio, para
// dejar margen al flush del MediaRecorder + subida y evitar que whisper-service
// rechace con 413 un audio auto-cortado.
export const LIVE_AUTO_STOP_SECONDS = MAX_AUDIO_DURATION_SECONDS - 10;

// El servidor da 60 s extra sobre el límite de duración al comparar la edad de
// la sesión live (wall-clock desde /start): cubre pausas cortas, flush y red.
// El límite real de duración del audio lo aplica whisper-service.
export const LIVE_FINISH_MAX_AGE_SECONDS = MAX_AUDIO_DURATION_SECONDS + 60;

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
