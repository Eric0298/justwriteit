import { query } from "@/lib/db";

export type TranscriptionType = "file" | "live";
export type TranscriptionStatus = "pending" | "processing" | "done" | "failed";
export type NotificationStatus = "none" | "pending" | "sent" | "failed";

// JSONB array (segments)
export type TranscriptionSegments = unknown[]; // o tiparlo más fuerte si quieres

export type TranscriptionRow = {
  id: string;
  user_id: string;
  type: TranscriptionType;
  language: string;
  status: TranscriptionStatus;
  audio_filename: string | null;
  audio_url: string | null;
  duration: number | null;
  transcript_text: string | null;
  segments: TranscriptionSegments | null;
  created_at: string;

  notification_status: NotificationStatus;
  notification_error: string | null;
};

const SELECT_COLUMNS = `
  id, user_id, type, language, status,
  audio_filename, audio_url, duration, transcript_text, segments, created_at,
  notification_status, notification_error
`;

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
    RETURNING ${SELECT_COLUMNS}
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
    RETURNING ${SELECT_COLUMNS}
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
  audioUrl?: string | null;
  segmentsJson?: string | null; // string JSON array (para castear a jsonb)
}): Promise<TranscriptionRow | null> {
  const res = await query<TranscriptionRow>(
    `
    UPDATE transcriptions
    SET transcript_text = $1,
        duration = COALESCE($2, duration),
        audio_filename = COALESCE($3, audio_filename),
        audio_url = COALESCE($4, audio_url),
        segments = COALESCE($5::jsonb, segments),
        status = 'done'
    WHERE id = $6 AND user_id = $7
    RETURNING ${SELECT_COLUMNS}
    `,
    [
      input.transcriptText,
      input.duration ?? null,
      input.audioFilename ?? null,
      input.audioUrl ?? null,
      input.segmentsJson ?? null,
      input.id,
      input.userId,
    ]
  );

  return res.rows[0] ?? null;
}

export async function setNotificationStatus(input: {
  id: string;
  userId: string;
  status: Exclude<NotificationStatus, "none">;
  error?: string | null;
}): Promise<TranscriptionRow | null> {
  const res = await query<TranscriptionRow>(
    `
    UPDATE transcriptions
    SET notification_status = $1,
        notification_error = $2
    WHERE id = $3 AND user_id = $4
    RETURNING ${SELECT_COLUMNS}
    `,
    [input.status, input.error ?? null, input.id, input.userId]
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
    SELECT ${SELECT_COLUMNS}
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
    SELECT ${SELECT_COLUMNS}
    FROM transcriptions
    WHERE user_id = $1 AND id = $2
    LIMIT 1
    `,
    [input.userId, input.id]
  );

  return res.rows[0] ?? null;
}

export async function searchUserTranscriptions(input: {
  userId: string;
  queryText: string;
  limit?: number;
}): Promise<TranscriptionRow[]> {
  const res = await query<TranscriptionRow>(
    `
    SELECT ${SELECT_COLUMNS}
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
