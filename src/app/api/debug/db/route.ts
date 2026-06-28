import { testDb } from "@/lib/db-test";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ ok: false, error: "No encontrado." }, { status: 404 });
  }

  try {
    const now = await testDb();
    return Response.json({ ok: true, now });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        error: e instanceof Error ? { message: e.message, name: e.name } : "Error de DB",
      },
      { status: 500 }
    );
  }
}

