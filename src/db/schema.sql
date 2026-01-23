CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NULL
);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type text NOT NULL CHECK (type IN ('file', 'live')),
  language text NOT NULL, -- ej: 'es', 'en', 'es-ES'

  status text NOT NULL CHECK (status IN ('pending', 'processing', 'done', 'failed')),

  audio_filename text NULL,
  duration integer NULL CHECK (duration >= 0), -- segundos (más simple que interval)

  transcript_text text NULL,

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

CREATE INDEX IF NOT EXISTS idx_transcriptions_transcript_fts
  ON transcriptions
  USING GIN (to_tsvector('simple', coalesce(transcript_text, '')));
