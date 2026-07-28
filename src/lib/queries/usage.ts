import { getClient, query } from "@/lib/db";
import type { UsageStatus } from "@/lib/types/usage";
import {
  DAILY_TRANSCRIPTION_LIMIT,
  MAX_AUDIO_FILE_SIZE_BYTES,
  MAX_AUDIO_FILE_SIZE_MB,
  buildUsageMessage,
  getRemainingTranscriptions,
} from "@/lib/usage/limits";

type UsageCountRow = {
  count: number | string;
  reset_at: string;
};

function toInt(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function buildStatus(input: {
  userId: string;
  usedToday: number;
  resetAt: string;
}): UsageStatus {
  const remainingToday = getRemainingTranscriptions(input.usedToday);

  return {
    userId: input.userId,
    usedToday: input.usedToday,
    dailyLimit: DAILY_TRANSCRIPTION_LIMIT,
    remainingToday,
    resetAt: input.resetAt,
    maxAudioFileSizeMb: MAX_AUDIO_FILE_SIZE_MB,
    maxAudioFileSizeBytes: MAX_AUDIO_FILE_SIZE_BYTES,
    canTranscribe: remainingToday > 0,
    message: buildUsageMessage(input.usedToday),
  };
}

export async function getUsageStatus(userId: string): Promise<UsageStatus> {
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

    if (currentCount >= DAILY_TRANSCRIPTION_LIMIT) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        status: buildStatus({ userId, usedToday: currentCount, resetAt }),
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
