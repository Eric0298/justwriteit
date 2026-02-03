import { fileTypeFromBuffer } from "file-type";

export const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
]);

export async function validateAudio(input: {
  buffer: Buffer;
  originalName: string;
}) {
  if (input.buffer.length <= 0) {
    throw new Error("El archivo está vacío.");
  }
  if (input.buffer.length > MAX_BYTES) {
    throw new Error("Archivo demasiado grande (máx 25MB).");
  }

  // MIME real por firma (más fiable que file.type)
  const ft = await fileTypeFromBuffer(input.buffer);

  const mime = ft?.mime ?? "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    throw new Error(`Tipo no permitido (detectado): ${mime}`);
  }

  return { mime };
}
