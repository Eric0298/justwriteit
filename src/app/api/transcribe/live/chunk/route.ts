import { auth } from "@/../auth";
import { insertLiveChunk, getLiveSession } from "@/lib/queries/live";

export const runtime = "nodejs";

const MAX_CHUNK_BYTES = 2 * 1024 * 1024; // 2MB por chunk (safe)

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const formData = await req.formData();
  const sessionId = String(formData.get("sessionId") ?? "");
  const chunkIndex = Number(formData.get("chunkIndex") ?? -1);
  const file = formData.get("chunk");

  if (!sessionId || !Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return Response.json({ ok: false, error: "sessionId/chunkIndex inválidos." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Falta el chunk." }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_CHUNK_BYTES) {
    return Response.json({ ok: false, error: "Chunk inválido o demasiado grande." }, { status: 413 });
  }

  const live = await getLiveSession({ sessionId, userId: session.user.id });
  if (!live || live.status !== "recording") {
    return Response.json({ ok: false, error: "Sesión no válida o no está grabando." }, { status: 404 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  await insertLiveChunk({
    sessionId,
    chunkIndex,
    data: buf,
  });

  return Response.json({ ok: true });
}
