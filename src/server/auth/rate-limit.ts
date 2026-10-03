import "server-only";
import { db } from "@/server/db";

/**
 * Fixed-window rate limiter backed by Postgres (no Redis needed for a single firm).
 * Returns { ok: false } once `limit` hits occur within `windowMs`.
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const windowFloor = new Date(now.getTime() - windowMs);

  // Single atomic upsert: reset the window if it has expired, otherwise increment.
  const rows = await db.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < ${windowFloor} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < ${windowFloor} THEN ${now} ELSE "RateLimit"."windowStart" END
    RETURNING "count", "windowStart"`;

  const { count, windowStart } = rows[0];
  const retryAfterMs = Math.max(0, windowStart.getTime() + windowMs - now.getTime());
  return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterMs };
}

export async function resetRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}
