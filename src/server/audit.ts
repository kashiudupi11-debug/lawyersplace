import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "@/server/db";

const REDACT = new Set(["passwordHash", "tokenHash", "idNumber", "password"]);

function redact(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(
    JSON.stringify(value, (k, v) => (REDACT.has(k) ? "[redacted]" : typeof v === "bigint" ? v.toString() : v)),
  );
}

export type AuditEntry = {
  actorId: string | null;
  action: string; // "client.update"
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Append-only. Pass the transaction client so the audit row commits with the change. */
export async function writeAudit(entry: AuditEntry, tx: Tx | typeof db = db) {
  await tx.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: redact(entry.before),
      after: redact(entry.after),
      metadata: redact(entry.metadata),
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}

/** Only fields that actually changed, for compact before/after records. */
export function diff<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const b: Record<string, unknown> = {};
  const a: Record<string, unknown> = {};
  for (const key of Object.keys(after)) {
    const prev = before[key];
    const next = after[key];
    const same =
      prev instanceof Date && next instanceof Date ? prev.getTime() === next.getTime() : prev === next;
    if (!same) {
      b[key] = prev;
      a[key] = next;
    }
  }
  return { before: b, after: a, changed: Object.keys(a).length > 0 };
}
