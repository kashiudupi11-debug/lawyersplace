import "server-only";
import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { hashPassword, verifyPassword, dummyVerify, isStrongPassword, PASSWORD_RULES } from "@/server/auth/password";
import { createSession, destroyCurrentSession, revokeAllSessions, getSessionUser } from "@/server/auth/session";
import { rateLimit, resetRateLimit } from "@/server/auth/rate-limit";
import { generateToken, hashToken } from "@/server/auth/tokens";
import { getRequestInfo } from "@/server/auth/request-info";
import { sendEmail } from "@/server/integrations/email";

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

export type LoginResult =
  | { ok: true; role: string }
  | { ok: false; error: string };

const GENERIC_ERROR = "Incorrect email or password.";

export async function login(emailRaw: string, password: string): Promise<LoginResult> {
  const email = emailRaw.trim().toLowerCase();
  const info = await getRequestInfo();

  // Two limits: per IP (stops spraying many accounts) and per email (stops targeted guessing).
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit(`login:ip:${info.ipAddress}`, 30, 15 * 60 * 1000),
    rateLimit(`login:email:${email}`, 10, 15 * 60 * 1000),
  ]);
  if (!ipLimit.ok || !emailLimit.ok) {
    return { ok: false, error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  const user = await db.user.findUnique({ where: { email }, include: { role: true } });
  if (!user) {
    await dummyVerify(password);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await dummyVerify(password);
    return { ok: false, error: "This account is temporarily locked after repeated failed attempts. Try again in 15 minutes." };
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid || !user.isActive) {
    const failed = user.failedLoginCount + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed >= MAX_FAILED ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MS) : undefined,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: failed >= MAX_FAILED ? "auth.locked" : "auth.login_failed",
      entityType: "User",
      entityId: user.id,
      ...info,
    });
    return { ok: false, error: GENERIC_ERROR };
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await resetRateLimit(`login:email:${email}`);
  await createSession(user.id, info);
  await writeAudit({ actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id, ...info });
  return { ok: true, role: user.role.key };
}

export async function logout() {
  const user = await getSessionUser();
  await destroyCurrentSession();
  if (user) {
    const info = await getRequestInfo();
    await writeAudit({ actorId: user.id, action: "auth.logout", entityType: "User", entityId: user.id, ...info });
  }
}

/** Always resolves the same way whether or not the email exists (no account enumeration). */
export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const info = await getRequestInfo();
  const limit = await rateLimit(`reset:ip:${info.ipAddress}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return;

  const token = generateToken();
  await db.passwordResetToken.create({
    data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password/${token}`;

  const result = await sendEmail({
    to: user.email,
    subject: "Reset your LegalDesk password",
    text: `A password reset was requested for your account.\n\nReset link (valid for 30 minutes):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
  });

  if (result.status !== "SENT" && process.env.NODE_ENV !== "production") {
    // Development only: no email provider configured, so surface the link in the server console.
    console.info(`[dev] Password reset link for ${user.email}: ${link} (email status: ${result.status})`);
  }
  await writeAudit({
    actorId: user.id,
    action: "auth.reset_requested",
    entityType: "User",
    entityId: user.id,
    metadata: { emailStatus: result.status },
    ...info,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  if (!isStrongPassword(newPassword)) return { ok: false as const, error: PASSWORD_RULES.describe };

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false as const, error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await hashPassword(newPassword);
  const info = await getRequestInfo();
  await db.$transaction(async (tx) => {
    // Claim the token atomically so it can only be used once.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("Token already used");
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    });
    await writeAudit(
      { actorId: record.userId, action: "auth.password_reset", entityType: "User", entityId: record.userId, ...info },
      tx,
    );
  });
  await revokeAllSessions(record.userId);
  return { ok: true as const };
}

export function isTokenShapeValid(token: string) {
  return /^[A-Za-z0-9_-]{40,60}$/.test(token);
}
