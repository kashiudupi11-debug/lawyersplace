import "server-only";
import type { Tx } from "@/server/db";

const FORMATS = {
  client: { prefix: "CL", pad: 5 },
  case: { prefix: "CASE", pad: 4 },
  invoice: { prefix: "INV", pad: 4 },
  receipt: { prefix: "RCPT", pad: 4 },
} as const;

export type SequenceName = keyof typeof FORMATS;

/**
 * Next human-readable code, e.g. CL-2026-00001. Must run inside a transaction:
 * the upsert row lock serializes concurrent callers so codes never collide.
 */
export async function nextCode(tx: Tx, name: SequenceName, prefixOverride?: string, now = new Date()) {
  const year = now.getUTCFullYear();
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "Sequence" ("name", "year", "value") VALUES (${name}, ${year}, 1)
    ON CONFLICT ("name", "year") DO UPDATE SET "value" = "Sequence"."value" + 1
    RETURNING "value"`;
  const { prefix, pad } = FORMATS[name];
  return `${prefixOverride ?? prefix}-${year}-${String(rows[0].value).padStart(pad, "0")}`;
}
