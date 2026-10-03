import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionUser } from "@/server/auth/session";

/**
 * Record-level visibility rules. Every service query that returns case-linked data
 * must AND one of these into its `where`. Permissions decide *what kind* of action is
 * allowed; scopes decide *which rows*.
 */

export function caseScope(user: SessionUser, opts: { allLawyersSeeAllCases?: boolean } = {}): Prisma.CaseWhereInput {
  const base: Prisma.CaseWhereInput = { deletedAt: null };
  switch (user.role) {
    case "SUPER_ADMIN":
    case "ACCOUNTANT":
      return base;
    case "LAWYER":
      if (opts.allLawyersSeeAllCases) return base;
      return { ...base, OR: [{ leadLawyerId: user.id }, { assignments: { some: { userId: user.id } } }] };
    case "STAFF":
      return { ...base, OR: [{ leadLawyerId: user.id }, { assignments: { some: { userId: user.id } } }] };
    case "CLIENT":
      // Unreachable client ids yield an empty result rather than everything.
      return { ...base, clientId: user.clientId ?? "__none__" };
  }
}

export function clientScope(user: SessionUser, opts: { allLawyersSeeAllCases?: boolean } = {}): Prisma.ClientWhereInput {
  const base: Prisma.ClientWhereInput = { deletedAt: null };
  switch (user.role) {
    case "SUPER_ADMIN":
    case "ACCOUNTANT":
      return base;
    case "LAWYER":
      if (opts.allLawyersSeeAllCases) return base;
    // falls through
    case "STAFF":
      return {
        ...base,
        OR: [
          { assignedLawyerId: user.id },
          { assignedStaffId: user.id },
          { cases: { some: caseScope(user, opts) } },
        ],
      };
    case "CLIENT":
      return { ...base, id: user.clientId ?? "__none__" };
  }
}
