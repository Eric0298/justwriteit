import { testDb } from "@/lib/db-test";

export const runtime = "nodejs";

export async function GET() {
  try {
    const now = await testDb();
    return Response.json({ ok: true, now });
  }  catch (e) {
  const err = e as unknown;

  return Response.json(
    {
      ok: false,
      error:
        err instanceof Error
          ? { message: err.message, name: err.name, stack: err.stack }
          : String(err),
      raw: err,
    },
    { status: 500 }
  );
}
}