import { auth } from "@/../auth";
import { PublicApiError, toPublicError } from "@/lib/api/errors";
import { getUsageStatus, releaseDailyTranscriptionUsage, reserveDailyTranscriptionUsage } from "@/lib/queries/usage";
import {
  createTranscription,
  setNotificationStatus,
  setTranscriptText,
  updateTranscriptionStatus,
  type TranscriptionRow,
} from "@/lib/queries/transcriptions";
import { getUserById } from "@/lib/queries/users";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";
import { assertAllowedRemoteAudioUrl } from "@/lib/security/remoteAudio";
import { validateAudio } from "@/lib/security/audioValidation";
import { getTranscriptionAdapter } from "@/lib/transcription/adapter";
import { transcribeFileSchema } from "@/lib/validators/transcribe";
import { notifyTranscriptionCompleted } from "@/lib/mailer";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  fileUrl: string;
  filename: string;
  mimeType: string;
  language: string;
  context?: string;
};

function isBody(v: unknown): v is Body {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.fileUrl === "string" &&
    typeof o.filename === "string" &&
    typeof o.mimeType === "string" &&
    typeof o.language === "string"
  );
}

function publicValidationError(error: unknown): PublicApiError {
  const message = error instanceof Error ? error.message : "Archivo de audio no valido.";
  const status = message.toLowerCase().includes("grande") ? 413 : 415;
  return new PublicApiError(message, status);
}

async function notifyUser(input: {
  saved: TranscriptionRow;
  userId: string;
  text: string;
}) {
  try {
    const user = await getUserById(input.userId);
    if (!user) return;

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      "https://justwriteit-i6j1.vercel.app";

    const notifyRes = await notifyTranscriptionCompleted({
      transcriptionId: input.saved.id,
      userEmail: user.email,
      userName: user.name,
      language: input.saved.language,
      type: input.saved.type,
      createdAt: new Date(input.saved.created_at).toISOString(),
      textSnippet: (input.text ?? "").slice(0, 300),
      detailUrl: `${baseUrl}/dashboard/history/${input.saved.id}`,
    });

    await setNotificationStatus({
      id: input.saved.id,
      userId: input.userId,
      status: notifyRes.ok ? "sent" : "failed",
      error: notifyRes.ok ? null : notifyRes.error ?? "notification error",
    });
  } catch (error) {
    console.error(
      "notification failed (ignored):",
      error instanceof Error ? error.message : "unknown"
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `transcribe-file:${session.user.id}:${ip}`,
    limit: 6,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Demasiadas transcripciones seguidas. Espera un momento." },
      { status: 429 }
    );
  }

  const body: unknown = await req.json().catch(() => null);
  if (!isBody(body)) {
    return Response.json({ ok: false, error: "Body invalido." }, { status: 400 });
  }

  const parsed = transcribeFileSchema.safeParse({
    language: body.language,
    context: body.context ?? "",
  });

  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Datos invalidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let row: TranscriptionRow | null = null;
  let usageReserved = false;

  try {
    const safeFileUrl = assertAllowedRemoteAudioUrl(body.fileUrl);
    const reservation = await reserveDailyTranscriptionUsage(session.user.id);

    if (!reservation.ok) {
      return Response.json(
        { ok: false, error: reservation.status.message, usage: reservation.status },
        { status: 429 }
      );
    }

    usageReserved = true;
    const usage = reservation.status;

    row = await createTranscription({
      userId: session.user.id,
      type: "file",
      language: parsed.data.language,
      status: "processing",
      audioFilename: body.filename,
    });

    const fileRes = await fetch(safeFileUrl, { cache: "no-store" });
    if (!fileRes.ok) {
      throw new PublicApiError("No se pudo descargar el archivo de audio.", 502);
    }

    const lenHeader = fileRes.headers.get("content-length");
    if (lenHeader) {
      const len = Number(lenHeader);
      if (Number.isFinite(len) && len > usage.maxAudioFileSizeBytes) {
        throw new PublicApiError(
          `Archivo demasiado grande (max ${usage.maxAudioFileSizeMb}MB).`,
          413
        );
      }
    }

    const ab = await fileRes.arrayBuffer();
    if (ab.byteLength <= 0) throw new PublicApiError("Archivo vacio.", 400);
    if (ab.byteLength > usage.maxAudioFileSizeBytes) {
      throw new PublicApiError(
        `Archivo demasiado grande (max ${usage.maxAudioFileSizeMb}MB).`,
        413
      );
    }

    const buffer = Buffer.from(ab);
    let detectedMime: string;
    try {
      const validation = await validateAudio({
        buffer,
        originalName: body.filename,
        maxBytes: usage.maxAudioFileSizeBytes,
      });
      detectedMime = validation.mime;
    } catch (error) {
      throw publicValidationError(error);
    }

    const adapter = getTranscriptionAdapter();
    const out = await adapter.transcribeFile({
      fileBuffer: buffer,
      filename: body.filename,
      mimeType: detectedMime,
      language: parsed.data.language,
      context: parsed.data.context || undefined,
    });

    const segs = out.segments ?? [];
    const segmentsJson = segs.length > 0 ? JSON.stringify(segs) : null;

    const saved = await setTranscriptText({
      id: row.id,
      userId: session.user.id,
      transcriptText: out.text,
      duration: out.durationSec ? Math.round(out.durationSec) : null,
      audioFilename: body.filename,
      audioUrl: safeFileUrl,
      segmentsJson,
      fileSizeBytes: buffer.byteLength,
    });

    if (!saved) {
      throw new Error("No se pudo guardar la transcripcion.");
    }

    await notifyUser({ saved, userId: session.user.id, text: out.text });

    return Response.json({
      ok: true,
      transcription: {
        ...saved,
        segments: segs,
      },
      usage: await getUsageStatus(session.user.id),
    });
  } catch (error) {
    if (row) {
      await updateTranscriptionStatus({
        id: row.id,
        userId: session.user.id,
        status: "failed",
      }).catch(() => undefined);
    }

    const usage = usageReserved
      ? await releaseDailyTranscriptionUsage(session.user.id).catch(() => null)
      : null;

    const publicError = toPublicError(error, "Error procesando transcripcion.");

    return Response.json(
      { ok: false, error: publicError.message, usage },
      { status: publicError.status }
    );
  }
}
