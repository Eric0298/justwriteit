CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'FREE';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id text NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_plan_check'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_plan_check CHECK (plan IN ('FREE', 'PRO', 'PREMIUM'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS audio_url text NULL;

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS segments jsonb NULL;

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS file_size_bytes bigint NULL CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS is_free_usage boolean NOT NULL DEFAULT true;

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'FREE';

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'pending';

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS notification_error text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transcriptions_plan_check'
  ) THEN
    ALTER TABLE transcriptions
    ADD CONSTRAINT transcriptions_plan_check CHECK (plan IN ('FREE', 'PRO', 'PREMIUM'));
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL,
  plan text NOT NULL CHECK (plan IN ('FREE', 'PRO', 'PREMIUM')),
  current_period_end timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions (status);

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL
);

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

