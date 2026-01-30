// src/app/api/transcribe/file/route.ts
import { auth } from "@/../auth";
import { transcribeFileSchema } from "@/lib/validators/transcribe";
import { getTranscriptionAdapter } from "@/lib/transcription/adapter";
import {
  createTranscription,
  setTranscriptText,
  updateTranscriptionStatus,
} from "@/lib/queries/transcriptions";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const formData = await req.formData();

  const language = String(formData.get("language") ?? "");
  const context = String(formData.get("context") ?? "");

  const parsed = transcribeFileSchema.safeParse({ language, context });
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Falta el archivo." }, { status: 400 });
  }

  if (file.size <= 0) {
    return Response.json({ ok: false, error: "El archivo está vacío." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ ok: false, error: "Archivo demasiado grande (máx 25MB)." }, { status: 413 });
  }

  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return Response.json({ ok: false, error: `Tipo no permitido: ${file.type}` }, { status: 415 });
  }

  const row = await createTranscription({
    userId: session.user.id,
    type: "file",
    language: parsed.data.language,
    status: "processing",
    audioFilename: file.name,
  });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const adapter = getTranscriptionAdapter();
    const out = await adapter.transcribeFile({
      fileBuffer: buffer,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      language: parsed.data.language,
      context: parsed.data.context || undefined,
    });

    const saved = await setTranscriptText({
      id: row.id,
      userId: session.user.id,
      transcriptText: out.text,
      duration: out.durationSec ? Math.round(out.durationSec) : null,
      audioFilename: file.name,
    });

    return Response.json({ ok: true, transcription: saved });
  } catch (e) {
    await updateTranscriptionStatus({
      id: row.id,
      userId: session.user.id,
      status: "failed",
    });

    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error procesando transcripción." },
      { status: 500 }
    );
  }
}
