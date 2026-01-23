import { query } from "@/lib/db";

export type TranscriptionType = "file" | "live";
export type TranscriptionStatus = "pending" | "processing" | "done" | "failed";

export type TranscriptionRow = {
  id: string;
  user_id: string;
  type: TranscriptionType;
  language: string;
  status: TranscriptionStatus;
  audio_filename: string | null;
  duration: number | null;
  transcript_text: string | null;
  created_at: string;
};

export async function createTranscription(input: {
  userId: string;
  type: TranscriptionType;
  language: string;
  status?: TranscriptionStatus;
  audioFilename?: string | null;
  duration?: number | null;
  transcriptText?: string | null;
}): Promise<TranscriptionRow> {
  const res = await query<TranscriptionRow>(
    `
    INSERT INTO transcriptions (
      user_id, type, language, status, audio_filename, duration, transcript_text
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id, user_id, type, language, status, audio_filename, duration, transcript_text, created_at
    `,
    [
      input.userId,
      input.type,
      input.language,
      input.status ?? "pending",
      input.audioFilename ?? null,
      input.duration ?? null,
      input.transcriptText ?? null,
    ]
  );

  return res.rows[0];
}

export async function updateTranscriptionStatus(input: {
  id: string;
  userId: string;
  status: TranscriptionStatus;
}): Promise<TranscriptionRow | null> {
  const res = await query<TranscriptionRow>(
    `
    UPDATE transcriptions
    SET status = $1
    WHERE id = $2 AND user_id = $3
    RETURNING
      id, user_id, type, language, status, audio_filename, duration, transcript_text, created_at
    `,
    [input.status, input.id, input.userId]
  );

  return res.rows[0] ?? null;
}

export async function setTranscriptText(input: {
  id: string;
  userId: string;
  transcriptText: string;
  duration?: number | null;
  audioFilename?: string | null;
}): Promise<TranscriptionRow | null> {
  const res = await query<TranscriptionRow>(
    `
    UPDATE transcriptions
    SET transcript_text = $1,
        duration = COALESCE($2, duration),
        audio_filename = COALESCE($3, audio_filename),
        status = 'done'
    WHERE id = $4 AND user_id = $5
    RETURNING
      id, user_id, type, language, status, audio_filename, duration, transcript_text, created_at
    `,
    [
      input.transcriptText,
      input.duration ?? null,
      input.audioFilename ?? null,
      input.id,
      input.userId,
    ]
  );

  return res.rows[0] ?? null;
}

export async function listUserTranscriptions(input: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<TranscriptionRow[]> {
  const res = await query<TranscriptionRow>(
    `
    SELECT
      id, user_id, type, language, status, audio_filename, duration, transcript_text, created_at
    FROM transcriptions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [input.userId, input.limit ?? 20, input.offset ?? 0]
  );

  return res.rows;
}

export async function getUserTranscriptionById(input: {
  userId: string;
  id: string;
}): Promise<TranscriptionRow | null> {
  const res = await query<TranscriptionRow>(
    `
    SELECT
      id, user_id, type, language, status, audio_filename, duration, transcript_text, created_at
    FROM transcriptions
    WHERE user_id = $1 AND id = $2
    LIMIT 1
    `,
    [input.userId, input.id]
  );

  return res.rows[0] ?? null;
}

/**
 * Búsqueda full-text básica (usa el índice GIN que creamos)
 * queryText: texto que el usuario busca dentro de transcript_text
 */
export async function searchUserTranscriptions(input: {
  userId: string;
  queryText: string;
  limit?: number;
}): Promise<TranscriptionRow[]> {
  const res = await query<TranscriptionRow>(
    `
    SELECT
      id, user_id, type, language, status, audio_filename, duration, transcript_text, created_at
    FROM transcriptions
    WHERE user_id = $1
      AND to_tsvector('simple', coalesce(transcript_text, ''))
          @@ plainto_tsquery('simple', $2)
    ORDER BY created_at DESC
    LIMIT $3
    `,
    [input.userId, input.queryText, input.limit ?? 20]
  );

  return res.rows;
}
