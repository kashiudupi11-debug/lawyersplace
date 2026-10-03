import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";
import type { Permission } from "./permissions";

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export function can(user: SessionUser, permission: Permission) {
  return user.permissions.has(permission);
}

/** Throws unless the actor holds the permission. Use inside services. */
export function authorize(user: SessionUser, permission: Permission) {
  if (!can(user, permission)) throw new AuthorizationError();
}

/** For pages/layouts: redirect to login when signed out. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** For staff workspace pages: client-role users go to the portal. */
export async function requireStaff(permission: Permission = "dashboard:view") {
  const user = await requireUser();
  if (user.role === "CLIENT") redirect("/portal");
  if (!can(user, permission)) redirect("/dashboard?denied=1");
  return user;
}

export async function requirePortalUser() {
  const user = await requireUser();
  if (!can(user, "portal:access") || !user.clientId) redirect("/dashboard");
  return user;
}
