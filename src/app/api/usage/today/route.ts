import { auth } from "@/../auth";
import { getUsageStatus } from "@/lib/queries/usage";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const usage = await getUsageStatus(session.user.id);
  return Response.json({ ok: true, usage });
}

