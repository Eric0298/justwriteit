-- Drop Stripe/billing artifacts. The app becomes a single free tier
-- (10 transcriptions/day, 50 MB per audio). `daily_usage` and
-- `rate_limits` remain in place to protect the Whisper backend.

DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS stripe_events;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;
DROP INDEX IF EXISTS idx_users_stripe_customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS plan;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;

ALTER TABLE transcriptions DROP CONSTRAINT IF EXISTS transcriptions_plan_check;
ALTER TABLE transcriptions DROP COLUMN IF EXISTS plan;
ALTER TABLE transcriptions DROP COLUMN IF EXISTS is_free_usage;
