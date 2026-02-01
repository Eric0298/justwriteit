import { auth } from "@/../auth";
import { deleteUserTranscription } from "@/lib/queries/transcription-extra";

export const runtime = "nodejs";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const { id } = await ctx.params;

  const ok = await deleteUserTranscription({ userId: session.user.id, id });

  // 404 si no existe o no pertenece al usuario (seguridad multiusuario)
  if (!ok) {
    return Response.json({ ok: false, error: "No encontrado." }, { status: 404 });
  }

  return Response.json({ ok: true });
}
