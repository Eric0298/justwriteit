import { query } from "@/lib/db";

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: string;
};

export async function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + input.windowMs);

  // Limpieza simple de expiradas
  await query(`DELETE FROM rate_limits WHERE reset_at < NOW()`, []);

  const res = await query<{ count: number; reset_at: string }>(
    `
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES ($1, 1, $2)
    ON CONFLICT (key)
    DO UPDATE SET
      count = CASE
        WHEN rate_limits.reset_at < NOW() THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at < NOW() THEN $2
        ELSE rate_limits.reset_at
      END
    RETURNING count, reset_at
    `,
    [input.key, resetAt.toISOString()]
  );

  const row = res.rows[0];
  const remaining = Math.max(0, input.limit - row.count);

  return {
    ok: row.count <= input.limit,
    remaining,
    resetAt: row.reset_at,
  };
}
