import { auth } from "@/../auth";
import { liveStartSchema } from "@/lib/validators/transcribe-live";
import { createLiveSession } from "@/lib/queries/live";
import { createTranscription } from "@/lib/queries/transcriptions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = liveStartSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Datos inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const mimeType = parsed.data.mimeType ?? "audio/webm";

  // 1) Crear sesión live
  const live = await createLiveSession({
    userId: session.user.id,
    language: parsed.data.language,
    context: parsed.data.context || null,
    mimeType,
  });

  // 2) Crear transcripción en estado processing
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
  });
}
