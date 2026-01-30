import { query } from "@/lib/db";

export async function testDb() {
  const res = await query<{ now: string }>("select now() as now");
  return res.rows[0]?.now;
}
