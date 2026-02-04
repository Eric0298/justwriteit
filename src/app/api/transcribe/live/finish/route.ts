import { auth } from "@/../auth";
import { z } from "zod";
import { getTranscriptionAdapter } from "@/lib/transcription/adapter";
import { setTranscriptText, updateTranscriptionStatus } from "@/lib/queries/transcriptions";
import { getLiveSession, listLiveChunks, updateLiveSessionStatus, deleteLiveChunks } from "@/lib/queries/live";

export const runtime = "nodejs";

// Límite máximo live: 30 minutos
const MAX_LIVE_MINUTES = 30;

const liveFinishSchema = z.object({
  sessionId: z.string().min(1),
  transcriptionId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = liveFinishSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sessionId, transcriptionId } = parsed.data;

  // 1) Validar sesión live
  const live = await getLiveSession({ sessionId, userId: session.user.id });
  if (!live) {
    return Response.json({ ok: false, error: "Sesión no encontrada." }, { status: 404 });
  }
  if (live.status !== "recording") {
    return Response.json({ ok: false, error: "La sesión no está en recording." }, { status: 409 });
  }

  // 2) Límite 30 min (usando created_at, que existe en tu tipo)
  const startedAt = new Date(live.created_at);
  const ageMs = Date.now() - startedAt.getTime();
  if (ageMs > MAX_LIVE_MINUTES * 60 * 1000) {
    await updateTranscriptionStatus({
      id: transcriptionId,
      userId: session.user.id,
      status: "failed",
    });
    await updateLiveSessionStatus({ sessionId, userId: session.user.id, status: "failed" });

    return Response.json(
      { ok: false, error: "La sesión supera el límite de 30 minutos." },
      { status: 413 }
    );
  }

  try {
    // 3) Recuperar chunks
    const chunks = await listLiveChunks({ sessionId });
    if (chunks.length === 0) {
      throw new Error("No hay chunks para transcribir.");
    }

    // 4) Unir audio en memoria (demo correcto)
    const merged = Buffer.concat(chunks.map((c) => c.data));

    // 5) Transcribir como archivo (reutilizamos el adapter file)
    const adapter = getTranscriptionAdapter();

    const filename = `live-${sessionId}.webm`;
    const mimeType = live.mime_type || "audio/webm";

    const out = await adapter.transcribeFile({
      fileBuffer: merged,
      filename,
      mimeType,
      language: live.language,
      context: live.context ?? undefined,
    });

    // 6) Guardar transcripción + marcar finished
    const saved = await setTranscriptText({
      id: transcriptionId,
      userId: session.user.id,
      transcriptText: out.text,
      duration: out.durationSec ? Math.round(out.durationSec) : null,
      audioFilename: filename,
    });

    await updateLiveSessionStatus({ sessionId, userId: session.user.id, status: "finished" });

    // 7) Limpieza (recomendado)
    await deleteLiveChunks({ sessionId });

    return Response.json({ ok: true, transcription: saved });
  } catch (e) {
    await updateTranscriptionStatus({
      id: transcriptionId,
      userId: session.user.id,
      status: "failed",
    });
    await updateLiveSessionStatus({ sessionId, userId: session.user.id, status: "failed" });

    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error finalizando transcripción." },
      { status: 500 }
    );
  }
}
