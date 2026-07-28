CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type text NOT NULL CHECK (type IN ('file', 'live')),
  language text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'done', 'failed')),

  audio_filename text NULL,
  audio_url text NULL,
  duration integer NULL CHECK (duration >= 0),
  file_size_bytes bigint NULL CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  transcript_text text NULL,
  segments jsonb NULL,

  notification_status text NOT NULL DEFAULT 'pending',
  notification_error text NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id_created_at
  ON transcriptions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcriptions_status
  ON transcriptions (status);

CREATE INDEX IF NOT EXISTS idx_transcriptions_type
  ON transcriptions (type);

CREATE INDEX IF NOT EXISTS idx_transcriptions_language
  ON transcriptions (language);

CREATE INDEX IF NOT EXISTS idx_transcriptions_notification_status
  ON transcriptions (notification_status);

CREATE INDEX IF NOT EXISTS idx_transcriptions_transcript_fts
  ON transcriptions
  USING GIN (to_tsvector('simple', coalesce(transcript_text, '')));

CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  transcription_count integer NOT NULL DEFAULT 0 CHECK (transcription_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date
  ON daily_usage (user_id, usage_date DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  reset_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at
  ON rate_limits (reset_at);

CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language text NOT NULL,
  context text NULL,
  mime_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('recording', 'finished', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_user_status
  ON live_sessions (user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS live_audio_chunks (
  session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  data bytea NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, chunk_index)
);
