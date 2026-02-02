ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'pending';

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS notification_error text;

CREATE INDEX IF NOT EXISTS idx_transcriptions_notification_status
  ON transcriptions (notification_status);
