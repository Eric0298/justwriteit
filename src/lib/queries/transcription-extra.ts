import { query, type DbValue } from "@/lib/db";

export async function countUserTranscriptions(input: {
  userId: string;
  search?: string;
}): Promise<number> {
  const params: DbValue[] = [input.userId];

  const searchClause =
    input.search
      ? `AND audio_filename ILIKE $${params.push("%" + input.search + "%")}`
      : "";

  const res = await query<{ count: string }>(
    `
    SELECT count(*)::text AS count
    FROM transcriptions
    WHERE user_id = $1
      ${searchClause}
    `,
    params
  );

  return Number(res.rows[0]?.count ?? "0");
}

export async function deleteUserTranscription(input: {
  userId: string;
  id: string;
}): Promise<boolean> {
  const res = await query<{ id: string }>(
    `
    DELETE FROM transcriptions
    WHERE id = $1 AND user_id = $2
    RETURNING id
    `,
    [input.id, input.userId]
  );

  return Boolean(res.rows[0]);
}

export async function updateTranscriptionTitle(input: {
  userId: string;
  id: string;
  newTitle: string;
}): Promise<boolean> {
  const res = await query<{ id: string }>(
    `
    UPDATE transcriptions
    SET audio_filename = $1
    WHERE id = $2 AND user_id = $3
    RETURNING id
    `,
    [input.newTitle, input.id, input.userId]
  );

  return Boolean(res.rows[0]);
}