import { query } from "@/lib/db";

export async function countUserTranscriptions(input: { userId: string }): Promise<number> {
  const res = await query<{ count: string }>(
    `
    select count(*)::text as count
    from transcriptions
    where user_id = $1
    `,
    [input.userId]
  );

  return Number(res.rows[0]?.count ?? "0");
}

export async function deleteUserTranscription(input: { userId: string; id: string }): Promise<boolean> {
  const res = await query<{ id: string }>(
    `
    delete from transcriptions
    where id = $1 and user_id = $2
    returning id
    `,
    [input.id, input.userId]
  );

  return Boolean(res.rows[0]);
}
