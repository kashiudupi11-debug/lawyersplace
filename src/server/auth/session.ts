import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { generateToken, hashToken } from "./tokens";
import type { Permission, RoleKey } from "./permissions";

const IS_PROD = process.env.NODE_ENV === "production";
// `__Host-` forces Secure + Path=/ + no Domain; only usable over HTTPS.
export const SESSION_COOKIE = IS_PROD ? "__Host-ld_session" : "ld_session";

const ABSOLUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const IDLE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const TOUCH_INTERVAL_MS = 5 * 60 * 1000; // throttle lastActiveAt writes

export type SessionUser = {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  role: RoleKey;
  permissions: ReadonlySet<Permission>;
  clientId: string | null;
  designation: string | null;
};

export async function createSession(userId: string, info: { ipAddress?: string; userAgent?: string | null }) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ABSOLUTE_TTL_MS);
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent ?? undefined,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Validates the session cookie against the database. Memoized per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      },
    },
  });
  if (!session) return null;

  const now = Date.now();
  const expired =
    session.expiresAt.getTime() <= now ||
    session.lastActiveAt.getTime() + IDLE_TTL_MS <= now ||
    !session.user.isActive;
  if (expired) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (now - session.lastActiveAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastActiveAt: new Date() } });
  }

  const { user } = session;
  return {
    id: user.id,
    sessionId: session.id,
    name: user.name,
    email: user.email,
    role: user.role.key as RoleKey,
    permissions: new Set(user.role.permissions.map((rp) => rp.permission.key as Permission)),
    clientId: user.clientId,
    designation: user.designation,
  };
});

export async function destroyCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
