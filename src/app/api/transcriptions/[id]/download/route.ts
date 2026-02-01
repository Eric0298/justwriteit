import { auth } from "@/../auth";
import { getUserTranscriptionById } from "@/lib/queries/transcriptions";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("No autenticado", { status: 401 });
  }

  const { id } = await ctx.params;

  const row = await getUserTranscriptionById({ userId: session.user.id, id });
  if (!row) {
    return new Response("No encontrado", { status: 404 });
  }

  const safeName = `justwriteit-${row.type}-${row.id}.txt`;
  const content =
    `JustWriteIt - Transcripción\n` +
    `ID: ${row.id}\n` +
    `Tipo: ${row.type}\n` +
    `Idioma: ${row.language}\n` +
    `Estado: ${row.status}\n` +
    `Fecha: ${row.created_at}\n` +
    `Archivo: ${row.audio_filename ?? "—"}\n\n` +
    `${row.transcript_text ?? ""}\n`;

  return new Response(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${safeName}"`,
    },
  });
}
