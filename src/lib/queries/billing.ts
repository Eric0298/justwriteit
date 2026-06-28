import { getClient, query } from "@/lib/db";
import {
  buildUsageMessage,
  getPlanLimits,
  normalizePlan,
  type PlanId,
} from "@/lib/billing/plans";

export type BillingProfile = {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  stripe_customer_id: string | null;
};

export type UsageStatus = {
  userId: string;
  plan: PlanId;
  planLabel: string;
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  resetAt: string;
  maxAudioFileSizeMb: number;
  maxAudioFileSizeBytes: number;
  canTranscribe: boolean;
  message: string;
};

type UsageCountRow = {
  count: number | string;
  reset_at: string;
};

type UserPlanRow = {
  plan: string | null;
};

function toInt(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function buildStatus(input: {
  userId: string;
  plan: PlanId;
  usedToday: number;
  resetAt: string;
}): UsageStatus {
  const limits = getPlanLimits(input.plan);
  const remainingToday = Math.max(0, limits.dailyTranscriptionLimit - input.usedToday);

  return {
    userId: input.userId,
    plan: input.plan,
    planLabel: limits.label,
    usedToday: input.usedToday,
    dailyLimit: limits.dailyTranscriptionLimit,
    remainingToday,
    resetAt: input.resetAt,
    maxAudioFileSizeMb: limits.maxAudioFileSizeMb,
    maxAudioFileSizeBytes: limits.maxAudioFileSizeMb * 1024 * 1024,
    canTranscribe: remainingToday > 0,
    message: buildUsageMessage({ plan: input.plan, usedToday: input.usedToday }),
  };
}

export async function getBillingProfile(userId: string): Promise<BillingProfile | null> {
  const res = await query<{
    id: string;
    email: string;
    name: string;
    plan: string | null;
    stripe_customer_id: string | null;
  }>(
    `
    SELECT id, email, name, plan, stripe_customer_id
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    ...row,
    plan: normalizePlan(row.plan),
  };
}

export async function getUsageStatus(userId: string): Promise<UsageStatus> {
  const userRes = await query<UserPlanRow>(
    `
    SELECT plan
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  const user = userRes.rows[0];
  if (!user) throw new Error("Usuario no encontrado.");

  const usageRes = await query<UsageCountRow>(
    `
    SELECT
      COALESCE((
        SELECT transcription_count
        FROM daily_usage
        WHERE user_id = $1 AND usage_date = CURRENT_DATE
      ), 0)::int AS count,
      (CURRENT_DATE + INTERVAL '1 day')::timestamptz AS reset_at
    `,
    [userId]
  );

  const usage = usageRes.rows[0];
  return buildStatus({
    userId,
    plan: normalizePlan(user.plan),
    usedToday: toInt(usage?.count),
    resetAt: usage?.reset_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function reserveDailyTranscriptionUsage(userId: string): Promise<{
  ok: boolean;
  status: UsageStatus;
}> {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const userRes = await client.query<UserPlanRow>(
      `
      SELECT plan
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    const user = userRes.rows[0];
    if (!user) throw new Error("Usuario no encontrado.");

    const plan = normalizePlan(user.plan);
    const limits = getPlanLimits(plan);

    await client.query(
      `
      INSERT INTO daily_usage (user_id, usage_date, transcription_count)
      VALUES ($1, CURRENT_DATE, 0)
      ON CONFLICT (user_id, usage_date) DO NOTHING
      `,
      [userId]
    );

    const usageRes = await client.query<UsageCountRow>(
      `
      SELECT transcription_count AS count,
             (CURRENT_DATE + INTERVAL '1 day')::timestamptz AS reset_at
      FROM daily_usage
      WHERE user_id = $1 AND usage_date = CURRENT_DATE
      FOR UPDATE
      `,
      [userId]
    );

    const usage = usageRes.rows[0];
    const currentCount = toInt(usage?.count);
    const resetAt =
      usage?.reset_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    if (currentCount >= limits.dailyTranscriptionLimit) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        status: buildStatus({ userId, plan, usedToday: currentCount, resetAt }),
      };
    }

    const updatedRes = await client.query<UsageCountRow>(
      `
      UPDATE daily_usage
      SET transcription_count = transcription_count + 1,
          updated_at = now()
      WHERE user_id = $1 AND usage_date = CURRENT_DATE
      RETURNING transcription_count AS count,
                (CURRENT_DATE + INTERVAL '1 day')::timestamptz AS reset_at
      `,
      [userId]
    );

    await client.query("COMMIT");

    const updated = updatedRes.rows[0];
    return {
      ok: true,
      status: buildStatus({
        userId,
        plan,
        usedToday: toInt(updated?.count),
        resetAt: updated?.reset_at ?? resetAt,
      }),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function releaseDailyTranscriptionUsage(userId: string): Promise<UsageStatus> {
  await query(
    `
    UPDATE daily_usage
    SET transcription_count = GREATEST(transcription_count - 1, 0),
        updated_at = now()
    WHERE user_id = $1 AND usage_date = CURRENT_DATE
    `,
    [userId]
  );

  return getUsageStatus(userId);
}

export async function setUserPlan(input: {
  userId: string;
  plan: PlanId;
  stripeCustomerId?: string | null;
}): Promise<void> {
  await query(
    `
    UPDATE users
    SET plan = $2,
        stripe_customer_id = COALESCE($3, stripe_customer_id),
        updated_at = now()
    WHERE id = $1
    `,
    [input.userId, input.plan, input.stripeCustomerId ?? null]
  );
}

export async function getUserIdByStripeCustomerId(
  stripeCustomerId: string
): Promise<string | null> {
  const res = await query<{ id: string }>(
    `
    SELECT id
    FROM users
    WHERE stripe_customer_id = $1
    LIMIT 1
    `,
    [stripeCustomerId]
  );

  return res.rows[0]?.id ?? null;
}

export async function upsertSubscription(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  plan: PlanId;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  await query(
    `
    INSERT INTO subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      plan,
      current_period_end
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (stripe_subscription_id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      status = EXCLUDED.status,
      plan = EXCLUDED.plan,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now()
    `,
    [
      input.userId,
      input.stripeCustomerId,
      input.stripeSubscriptionId,
      input.status,
      input.plan,
      input.currentPeriodEnd ?? null,
    ]
  );
}

export async function markStripeEventReceived(input: {
  eventId: string;
  eventType: string;
}): Promise<boolean> {
  const res = await query<{ event_id: string }>(
    `
    INSERT INTO stripe_events (event_id, event_type)
    VALUES ($1, $2)
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id
    `,
    [input.eventId, input.eventType]
  );

  return Boolean(res.rows[0]);
}

export async function markStripeEventProcessed(eventId: string): Promise<void> {
  await query(
    `
    UPDATE stripe_events
    SET processed_at = now()
    WHERE event_id = $1
    `,
    [eventId]
  );
}

export async function forgetStripeEvent(eventId: string): Promise<void> {
  await query(
    `
    DELETE FROM stripe_events
    WHERE event_id = $1 AND processed_at IS NULL
    `,
    [eventId]
  );
}

