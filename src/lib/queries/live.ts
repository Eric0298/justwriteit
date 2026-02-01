import { query } from "@/lib/db";

export type LiveSessionStatus = "recording" | "finished" | "failed";

export type LiveSessionRow = {
  id: string;
  user_id: string;
  language: string;
  context: string | null;
  mime_type: string;
  status: LiveSessionStatus;
  created_at: string;
  updated_at: string;
};

export async function createLiveSession(input: {
  userId: string;
  language: string;
  context?: string | null;
  mimeType: string;
}): Promise<LiveSessionRow> {
  const res = await query<LiveSessionRow>(
    `
    insert into live_sessions (user_id, language, context, mime_type, status)
    values ($1, $2, $3, $4, 'recording')
    returning id, user_id, language, context, mime_type, status, created_at, updated_at
    `,
    [input.userId, input.language, input.context ?? null, input.mimeType]
  );
  return res.rows[0];
}

export async function insertLiveChunk(input: {
  sessionId: string;
  chunkIndex: number;
  data: Buffer;
}): Promise<void> {
  await query(
    `
    insert into live_audio_chunks (session_id, chunk_index, data, size_bytes)
    values ($1, $2, $3, $4)
    on conflict (session_id, chunk_index) do nothing
    `,
    [input.sessionId, input.chunkIndex, input.data, input.data.length]
  );
}

export async function finishLiveSession(input: {
  sessionId: string;
  userId: string;
}): Promise<LiveSessionRow | null> {
  const res = await query<LiveSessionRow>(
    `
    update live_sessions
    set status='finished', updated_at=now()
    where id=$1 and user_id=$2
    returning id, user_id, language, context, mime_type, status, created_at, updated_at
    `,
    [input.sessionId, input.userId]
  );

  return res.rows[0] ?? null;
}

export async function getLiveSession(input: {
  sessionId: string;
  userId: string;
}): Promise<LiveSessionRow | null> {
  const res = await query<LiveSessionRow>(
    `
    select id, user_id, language, context, mime_type, status, created_at, updated_at
    from live_sessions
    where id=$1 and user_id=$2
    limit 1
    `,
    [input.sessionId, input.userId]
  );

  return res.rows[0] ?? null;
}

export async function getLiveChunksAsBuffer(input: {
  sessionId: string;
}): Promise<Buffer> {
  // Esto concatena todos los chunks en memoria: suficiente para mock / demo
  // Mas adelante usaremos storage (S3/R2) o streaming a proveedor.
  const res = await query<{ data: Buffer }>(
    `
    select data
    from live_audio_chunks
    where session_id=$1
    order by chunk_index asc
    `,
    [input.sessionId]
  );

  const buffers = res.rows.map((r) => r.data);
  return Buffer.concat(buffers);
}

export async function deleteLiveChunks(input: { sessionId: string }) {
  await query(`delete from live_audio_chunks where session_id=$1`, [input.sessionId]);
}
