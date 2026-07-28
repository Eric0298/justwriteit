import { auth } from "@/../auth";
import { releaseDailyTranscriptionUsage, reserveDailyTranscriptionUsage } from "@/lib/queries/usage";
import { createLiveSession, updateLiveSessionStatus, type LiveSessionRow } from "@/lib/queries/live";
import { createTranscription } from "@/lib/queries/transcriptions";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";
import { liveStartSchema } from "@/lib/validators/transcribe-live";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `transcribe-live-start:${session.user.id}:${ip}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Demasiados inicios de grabacion. Espera un momento." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = liveStartSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Datos invalidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const reservation = await reserveDailyTranscriptionUsage(session.user.id);
  if (!reservation.ok) {
    return Response.json(
      { ok: false, error: reservation.status.message, usage: reservation.status },
      { status: 429 }
    );
  }

  const mimeType = parsed.data.mimeType ?? "audio/webm";
  let live: LiveSessionRow | null = null;

  try {
    live = await createLiveSession({
      userId: session.user.id,
      language: parsed.data.language,
      context: parsed.data.context || null,
      mimeType,
    });

    const transcription = await createTranscription({
      userId: session.user.id,
      type: "live",
      language: parsed.data.language,
      status: "processing",
      audioFilename: null,
    });

    return Response.json({
      ok: true,
      sessionId: live.id,
      transcriptionId: transcription.id,
      usage: reservation.status,
    });
  } catch (error) {
    if (live) {
      await updateLiveSessionStatus({
        sessionId: live.id,
        userId: session.user.id,
        status: "failed",
      }).catch(() => undefined);
    }
    await releaseDailyTranscriptionUsage(session.user.id).catch(() => undefined);
    throw error;
  }
}
