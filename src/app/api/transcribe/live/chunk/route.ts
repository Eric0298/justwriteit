import { auth } from "@/../auth";
import { getLiveSession, insertLiveChunk } from "@/lib/queries/live";
import { isAllowedAudioMime } from "@/lib/security/audioValidation";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const MAX_CHUNK_BYTES = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `transcribe-live-chunk:${session.user.id}:${ip}`,
    limit: 120,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Demasiados chunks de audio. Intenta de nuevo en un momento." },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const sessionId = String(formData.get("sessionId") ?? "");
  const chunkIndex = Number(formData.get("chunkIndex") ?? -1);
  const file = formData.get("chunk");

  if (!sessionId || !Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return Response.json({ ok: false, error: "sessionId/chunkIndex invalidos." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Falta el chunk." }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_CHUNK_BYTES) {
    return Response.json({ ok: false, error: "Chunk invalido o demasiado grande." }, { status: 413 });
  }

  if (file.type && !isAllowedAudioMime(file.type)) {
    return Response.json({ ok: false, error: "Tipo de audio no permitido." }, { status: 415 });
  }

  const live = await getLiveSession({ sessionId, userId: session.user.id });
  if (!live || live.status !== "recording") {
    return Response.json({ ok: false, error: "Sesion no valida o no esta grabando." }, { status: 404 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  await insertLiveChunk({
    sessionId,
    chunkIndex,
    data: buf,
  });

  return Response.json({ ok: true });
}

