import { auth } from "@/../auth";
import { PublicApiError, toPublicError } from "@/lib/api/errors";
import { getUsageStatus, releaseDailyTranscriptionUsage } from "@/lib/queries/usage";
import {
  deleteLiveChunks,
  getLiveSession,
  listLiveChunks,
  updateLiveSessionStatus,
} from "@/lib/queries/live";
import {
  getUserTranscriptionById,
  setTranscriptText,
  updateTranscriptionStatus,
} from "@/lib/queries/transcriptions";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";
import { getTranscriptionAdapter } from "@/lib/transcription/adapter";
import {
  WhisperColdStartError,
  WhisperPayloadTooLargeError,
} from "@/lib/transcription/providers/whisper-http";
import {
  MAX_AUDIO_DURATION_MINUTES,
  MAX_AUDIO_FILE_SIZE_MB,
} from "@/lib/usage/limits";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_ROUTE_MS = maxDuration * 1000;
const ROUTE_SAFETY_MARGIN_MS = 15_000;
const MIN_POST_BUDGET_MS = 30_000;

const MAX_LIVE_MINUTES = MAX_AUDIO_DURATION_MINUTES;

const COLD_START_MESSAGE =
  "Despertando el servicio de transcripción, la primera petición puede tardar ~1 minuto. Vuelve a intentarlo en unos segundos.";

const liveFinishSchema = z.object({
  sessionId: z.string().min(1),
  transcriptionId: z.string().min(1),
});

export async function POST(req: Request) {
  const routeStartMs = Date.now();

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `transcribe-live-finish:${session.user.id}:${ip}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Demasiados cierres de grabacion. Espera un momento." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = liveFinishSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Datos invalidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sessionId, transcriptionId } = parsed.data;
  let shouldReleaseUsage = false;

  try {
    const live = await getLiveSession({ sessionId, userId: session.user.id });
    if (!live) throw new PublicApiError("Sesion no encontrada.", 404);
    if (live.status !== "recording") {
      throw new PublicApiError("La sesion no esta en grabacion.", 409);
    }

    const transcription = await getUserTranscriptionById({
      userId: session.user.id,
      id: transcriptionId,
    });

    if (!transcription) throw new PublicApiError("Transcripcion no encontrada.", 404);
    shouldReleaseUsage = transcription.status === "processing";

    const startedAt = new Date(live.created_at);
    const ageMs = Date.now() - startedAt.getTime();
    if (ageMs > MAX_LIVE_MINUTES * 60 * 1000) {
      throw new PublicApiError(
        `La sesion supera el limite de ${MAX_LIVE_MINUTES} minutos.`,
        413,
      );
    }

    const chunks = await listLiveChunks({ sessionId });
    if (chunks.length === 0) throw new PublicApiError("No hay audio para transcribir.", 400);

    const merged = Buffer.concat(chunks.map((c) => c.data));
    const usage = await getUsageStatus(session.user.id);
    if (merged.byteLength > usage.maxAudioFileSizeBytes) {
      throw new PublicApiError(
        `Audio demasiado grande (max ${usage.maxAudioFileSizeMb}MB).`,
        413
      );
    }

    const adapter = getTranscriptionAdapter();
    const filename = `live-${sessionId}.webm`;
    const mimeType = (live.mime_type || "audio/webm").split(";")[0].trim();

    try {
      await adapter.warmUp();
    } catch (err) {
      if (err instanceof WhisperColdStartError) {
        throw new PublicApiError(COLD_START_MESSAGE, 503, "whisper_cold_start");
      }
      throw err;
    }

    const remainingBudgetMs =
      MAX_ROUTE_MS - (Date.now() - routeStartMs) - ROUTE_SAFETY_MARGIN_MS;
    if (remainingBudgetMs < MIN_POST_BUDGET_MS) {
      throw new PublicApiError(COLD_START_MESSAGE, 503, "whisper_cold_start");
    }

    let out;
    try {
      out = await adapter.transcribeFile({
        fileBuffer: merged,
        filename,
        mimeType,
        language: live.language,
        context: live.context ?? undefined,
        timeoutMs: remainingBudgetMs,
      });
    } catch (err) {
      if (err instanceof WhisperPayloadTooLargeError) {
        throw new PublicApiError(
          `Audio demasiado grande o largo (máximo ${MAX_AUDIO_FILE_SIZE_MB} MB y ${MAX_AUDIO_DURATION_MINUTES} minutos): ${err.message}`,
          413,
          "whisper_too_large",
        );
      }
      if (err instanceof WhisperColdStartError) {
        throw new PublicApiError(COLD_START_MESSAGE, 503, "whisper_cold_start");
      }
      throw err;
    }

    const saved = await setTranscriptText({
      id: transcriptionId,
      userId: session.user.id,
      transcriptText: out.text,
      duration: out.durationSec ? Math.round(out.durationSec) : null,
      audioFilename: filename,
      fileSizeBytes: merged.byteLength,
    });

    if (!saved) throw new Error("No se pudo guardar la transcripcion.");

    await updateLiveSessionStatus({ sessionId, userId: session.user.id, status: "finished" });
    await deleteLiveChunks({ sessionId });

    return Response.json({
      ok: true,
      transcription: saved,
      usage: await getUsageStatus(session.user.id),
    });
  } catch (error) {
    await updateTranscriptionStatus({
      id: transcriptionId,
      userId: session.user.id,
      status: "failed",
    }).catch(() => undefined);

    await updateLiveSessionStatus({
      sessionId,
      userId: session.user.id,
      status: "failed",
    }).catch(() => undefined);

    const usage = shouldReleaseUsage
      ? await releaseDailyTranscriptionUsage(session.user.id).catch(() => null)
      : null;

    const publicError = toPublicError(error, "Error finalizando transcripcion.");

    return Response.json(
      { ok: false, error: publicError.message, code: publicError.code, usage },
      { status: publicError.status }
    );
  }
}

