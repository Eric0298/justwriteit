import { auth } from "@/../auth";
import { finishLiveSession, getLiveChunksAsBuffer, getLiveSession, deleteLiveChunks } from "@/lib/queries/live";
import { getTranscriptionAdapter } from "@/lib/transcription/adapter";
import { setTranscriptText, updateTranscriptionStatus } from "@/lib/queries/transcriptions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const sessionId = String(body?.sessionId ?? "");
  const transcriptionId = String(body?.transcriptionId ?? "");

  if (!sessionId || !transcriptionId) {
    return Response.json({ ok: false, error: "Faltan ids." }, { status: 400 });
  }

  const live = await getLiveSession({ sessionId, userId: session.user.id });
  if (!live) {
    return Response.json({ ok: false, error: "Sesión no encontrada." }, { status: 404 });
  }

  try {
    await finishLiveSession({ sessionId, userId: session.user.id });

    const audioBuffer = await getLiveChunksAsBuffer({ sessionId });

    const adapter = getTranscriptionAdapter();
    const out = await adapter.transcribeLive({
      audioBuffer,
      mimeType: live.mime_type,
      language: live.language,
      context: live.context ?? undefined,
    });

    const saved = await setTranscriptText({
      id: transcriptionId,
      userId: session.user.id,
      transcriptText: out.text,
      duration: out.durationSec ? Math.round(out.durationSec) : null,
      audioFilename: null,
    });

    // Limpieza (en demo está bien; en PRO decidiríamos política)
    await deleteLiveChunks({ sessionId });

    return Response.json({ ok: true, transcription: saved });
  } catch (e) {
    await updateTranscriptionStatus({
      id: transcriptionId,
      userId: session.user.id,
      status: "failed",
    });

    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error finalizando transcripción live." },
      { status: 500 }
    );
  }
}
