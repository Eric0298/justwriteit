import { auth } from "@/../auth";
import { transcribeFileSchema } from "@/lib/validators/transcribe";
import { getTranscriptionAdapter } from "@/lib/transcription/adapter";
import {
  createTranscription,
  setTranscriptText,
  updateTranscriptionStatus,
  setNotificationStatus,
} from "@/lib/queries/transcriptions";
import { getUserById } from "@/lib/queries/users";
import { notifyTranscriptionCompleted } from "@/lib/n8n";
import { parseBuffer } from "music-metadata";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_DURATION_SEC = 30 * 60; // 30 min

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

function normalizeMime(fileType: string) {
  const t = (fileType || "").toLowerCase().trim();
  if (t === "audio/mp3") return "audio/mpeg";
  return t;
}

async function getDurationSecondsSafe(input: {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}): Promise<number | null> {
  try {
    const meta = await parseBuffer(input.buffer, input.mimeType || undefined, {
      duration: true,
    });

    const d = meta.format.duration;
    if (!d || !Number.isFinite(d) || d <= 0) return null;

    return Math.round(d);
  } catch (err) {
    console.warn("No se pudo detectar duración:", input.filename, err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
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
      return Response.json(
        { ok: false, error: "Archivo demasiado grande (máx 25MB)." },
        { status: 413 }
      );
    }

    const mime = normalizeMime(file.type);
    if (mime && !ALLOWED_MIME.has(mime)) {
      return Response.json(
        { ok: false, error: `Tipo no permitido: ${file.type}` },
        { status: 415 }
      );
    }

    // 1) Leemos buffer UNA vez
    const buffer = Buffer.from(await file.arrayBuffer());

    // 2) Creamos registro "processing" (ahora dentro del try global)
    const row = await createTranscription({
      userId: session.user.id,
      type: "file",
      language: parsed.data.language,
      status: "processing",
      audioFilename: file.name,
    });

    // 3) Validación de DURACIÓN (máx 30 min)
    const durationSec = await getDurationSecondsSafe({
      buffer,
      mimeType: mime || "application/octet-stream",
      filename: file.name,
    });

    if (durationSec !== null && durationSec > MAX_DURATION_SEC) {
      await updateTranscriptionStatus({
        id: row.id,
        userId: session.user.id,
        status: "failed",
      });

      return Response.json(
        {
          ok: false,
          error: `Audio demasiado largo: ${durationSec}s. Máximo permitido: ${MAX_DURATION_SEC}s (30 min).`,
        },
        { status: 413 }
      );
    }

    // 4) Ejecutamos transcripción con adapter
    const adapter = getTranscriptionAdapter();

    const out = await adapter.transcribeFile({
      fileBuffer: buffer,
      filename: file.name,
      mimeType: mime || "application/octet-stream",
      language: parsed.data.language,
      context: parsed.data.context || undefined,
    });

    // 5) Guardamos resultado en BD (done)
    const finalDuration =
      durationSec !== null
        ? durationSec
        : out.durationSec
        ? Math.round(out.durationSec)
        : null;

    const saved = await setTranscriptText({
      id: row.id,
      userId: session.user.id,
      transcriptText: out.text,
      duration: finalDuration,
      audioFilename: file.name,
    });

    try {
      const user = await getUserById(session.user.id);
      if (user && saved) {
        const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

        const notifyRes = await notifyTranscriptionCompleted({
          transcriptionId: saved.id,
          userEmail: user.email,
          userName: user.name,
          language: saved.language,
          type: saved.type,
          createdAt: new Date(saved.created_at).toISOString(),
          textSnippet: (out.text ?? "").slice(0, 300),
          detailUrl: `${baseUrl}/dashboard/history/${saved.id}`,
        });

        await setNotificationStatus({
          id: saved.id,
          userId: session.user.id,
          status: notifyRes.ok ? "sent" : "failed",
          error: notifyRes.ok ? null : notifyRes.error ?? "n8n error",
        });
      }
    } catch (err) {
      console.error("n8n notify failed (ignored):", err);
    }

    return Response.json({ ok: true, transcription: saved });
  } catch (e) {
    // ✅ Nunca HTML: siempre JSON
    const msg = e instanceof Error ? e.message : "Error procesando transcripción.";
    console.error("api/transcribe/file failed:", e);

    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
