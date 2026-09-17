import { fileTypeFromBuffer } from "file-type";

export const DEFAULT_MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  // file-type detecta los .webm audio-only de MediaRecorder como video/webm
  // porque no siempre encuentra el TrackType en el prefijo EBML.
  "video/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
]);

const MIME_ALIASES: Record<string, string> = {
  "video/webm": "audio/webm",
};

function normalizeMime(raw: string): string {
  return raw.split(";")[0].trim().toLowerCase();
}

export function isAllowedAudioMime(mime: string): boolean {
  return ALLOWED_AUDIO_MIME_TYPES.has(normalizeMime(mime));
}

export async function validateAudio(input: {
  buffer: Buffer;
  originalName: string;
  maxBytes?: number;
}) {
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_AUDIO_BYTES;

  if (input.buffer.length <= 0) {
    throw new Error("El archivo esta vacio.");
  }

  if (input.buffer.length > maxBytes) {
    throw new Error(`Archivo demasiado grande (max ${Math.round(maxBytes / 1024 / 1024)}MB).`);
  }

  // MIME real por firma, mas fiable que file.type.
  const ft = await fileTypeFromBuffer(input.buffer);
  const detected = normalizeMime(ft?.mime ?? "application/octet-stream");

  if (!ALLOWED_AUDIO_MIME_TYPES.has(detected)) {
    throw new Error(`Tipo no permitido (detectado): ${detected}`);
  }

  return { mime: MIME_ALIASES[detected] ?? detected };
}

