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
export const dynamic = "force-dynamic";

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
    const meta = await parseBuffer(input.buffer, input.mimeType || undefined, { duration: true });
    const d = meta.format.duration;
    if (!d || !Number.isFinite(d) || d <= 0) return null;
    return Math.round(d);
  } catch (err) {
    console.warn("No se pudo detectar duración:", input.filename, err);
    return null;
  }
}

async function readAsJson(req: Request) {
  const body = await req.json().catch(() => null);
  return body as null | {
    language?: string;
    context?: string;
    blobUrl?: string;
    originalName?: string;
    mimeType?: string;
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // A) NUEVO MODO: JSON con blobUrl (recomendado)
  if (contentType.includes("application/json")) {
    const body = await readAsJson(req);

    const language = String(body?.language ?? "");
    const context = String(body?.context ?? "");
    const blobUrl = String(body?.blobUrl ?? "");
    const originalName = String(body?.originalName ?? "audio");
    const mimeTypeRaw = String(body?.mimeType ?? "application/octet-stream");

    const parsed = transcribeFileSchema.safeParse({ language, context });
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Datos inválidos.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!blobUrl || !blobUrl.startsWith("http")) {
      return Response.json({ ok: false, error: "blobUrl inválida." }, { status: 400 });
    }

    const mime = normalizeMime(mimeTypeRaw);
    if (mime && mime !== "application/octet-stream" && !ALLOWED_MIME.has(mime)) {
      return Response.json({ ok: false, error: `Tipo no permitido: ${mimeTypeRaw}` }, { status: 415 });
    }

    const row = await createTranscription({
      userId: session.user.id,
      type: "file",
      language: parsed.data.language,
      status: "processing",
      audioFilename: originalName,
    });

    try {
      const r = await fetch(blobUrl);
      if (!r.ok) throw new Error("No se pudo descargar el audio desde Blob.");

      const arr = await r.arrayBuffer();
      if (arr.byteLength <= 0) throw new Error("El archivo está vacío.");
      if (arr.byteLength > MAX_BYTES) {
        await updateTranscriptionStatus({ id: row.id, userId: session.user.id, status: "failed" });
        return Response.json({ ok: false, error: "Archivo demasiado grande (máx 25MB)." }, { status: 413 });
      }

      const buffer = Buffer.from(arr);

      const durationSec = await getDurationSecondsSafe({
        buffer,
        mimeType: mime || "application/octet-stream",
        filename: originalName,
      });

      if (durationSec !== null && durationSec > MAX_DURATION_SEC) {
        await updateTranscriptionStatus({ id: row.id, userId: session.user.id, status: "failed" });
        return Response.json(
          { ok: false, error: `Audio demasiado largo. Máximo 30 min.` },
          { status: 413 }
        );
      }

      const adapter = getTranscriptionAdapter();
      const out = await adapter.transcribeFile({
        fileBuffer: buffer,
        filename: originalName,
        mimeType: mime || "application/octet-stream",
        language: parsed.data.language,
        context: parsed.data.context || undefined,
      });

      const finalDuration =
        durationSec !== null ? durationSec : out.durationSec ? Math.round(out.durationSec) : null;

      const saved = await setTranscriptText({
        id: row.id,
        userId: session.user.id,
        transcriptText: out.text,
        duration: finalDuration,
        audioFilename: originalName,
      });

      // notificación no bloqueante
      try {
        const user = await getUserById(session.user.id);
        if (user && saved) {
          const baseUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

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
      await updateTranscriptionStatus({ id: row.id, userId: session.user.id, status: "failed" });
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Error procesando transcripción." },
        { status: 500 }
      );
    }
  }

  // B) MODO ANTIGUO: FormData (lo dejo para compatibilidad)
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

  const mime = normalizeMime(file.type);
  if (mime && !ALLOWED_MIME.has(mime)) {
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

    const durationSec = await getDurationSecondsSafe({
      buffer,
      mimeType: mime || "application/octet-stream",
      filename: file.name,
    });

    if (durationSec !== null && durationSec > MAX_DURATION_SEC) {
      await updateTranscriptionStatus({ id: row.id, userId: session.user.id, status: "failed" });
      return Response.json({ ok: false, error: "Audio demasiado largo. Máximo 30 min." }, { status: 413 });
    }

    const adapter = getTranscriptionAdapter();
    const out = await adapter.transcribeFile({
      fileBuffer: buffer,
      filename: file.name,
      mimeType: mime || "application/octet-stream",
      language: parsed.data.language,
      context: parsed.data.context || undefined,
    });

    const finalDuration =
      durationSec !== null ? durationSec : out.durationSec ? Math.round(out.durationSec) : null;

    const saved = await setTranscriptText({
      id: row.id,
      userId: session.user.id,
      transcriptText: out.text,
      duration: finalDuration,
      audioFilename: file.name,
    });

    return Response.json({ ok: true, transcription: saved });
  } catch (e) {
    await updateTranscriptionStatus({ id: row.id, userId: session.user.id, status: "failed" });
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error procesando transcripción." },
      { status: 500 }
    );
  }
}
