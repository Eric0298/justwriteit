// src/app/api/transcriptions/[id]/title/route.ts
import { auth } from "@/../auth";
import { updateTranscriptionTitle } from "@/lib/queries/transcription-extra";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return Response.json(
        { ok: false, error: "El título no puede estar vacío." },
        { status: 400 }
      );
    }

    const ok = await updateTranscriptionTitle({
      userId: session.user.id,
      id,
      newTitle: title.trim(),
    });

    if (!ok) {
      return Response.json(
        { ok: false, error: "No encontrado." },
        { status: 404 }
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error updating title:", error);
    return Response.json(
      { ok: false, error: "Error al actualizar." },
      { status: 500 }
    );
  }
}