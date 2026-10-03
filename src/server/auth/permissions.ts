// Permission catalog and default role grants. Seeded into Role/Permission tables;
// SUPER_ADMIN can adjust grants later. Code checks permission keys, never role names,
// except for record scoping where the role determines the visibility rule.

export const ROLE_KEYS = ["SUPER_ADMIN", "LAWYER", "STAFF", "ACCOUNTANT", "CLIENT"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const PERMISSIONS = {
  "dashboard:view": "View the staff dashboard",
  "client:read": "View clients",
  "client:write": "Create and edit clients",
  "client:archive": "Archive and restore clients",
  "client:export": "Export client lists",
  "case:read": "View cases",
  "case:write": "Create and edit cases",
  "case:delete": "Delete cases",
  "note:read": "Read internal case notes",
  "note:write": "Write case notes",
  "hearing:read": "View hearings",
  "hearing:write": "Create and update hearings",
  "deadline:read": "View deadlines",
  "deadline:write": "Create and update deadlines",
  "task:read": "View tasks",
  "task:write": "Create and update tasks",
  "appointment:read": "View appointments",
  "appointment:write": "Create and update appointments",
  "communication:read": "View communication history",
  "communication:write": "Log communications",
  "document:read": "View and download documents",
  "document:write": "Upload and edit documents",
  "document:delete": "Delete documents",
  "billing:read": "View invoices and payments",
  "billing:write": "Create invoices and record payments",
  "report:read": "View reports",
  "report:export": "Export reports",
  "report:financial": "View financial reports",
  "ai:use": "Use LegalDesk AI",
  "user:manage": "Manage users and roles",
  "settings:manage": "Manage firm settings and lookups",
  "audit:read": "View audit logs",
  "backup:read": "View backup status",
  "portal:access": "Access the client portal",
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as Permission[];

const PRACTICE: Permission[] = [
  "dashboard:view",
  "client:read", "client:write", "client:archive",
  "case:read", "case:write",
  "note:read", "note:write",
  "hearing:read", "hearing:write",
  "deadline:read", "deadline:write",
  "task:read", "task:write",
  "appointment:read", "appointment:write",
  "communication:read", "communication:write",
  "document:read", "document:write",
  "ai:use",
];

export const DEFAULT_ROLE_GRANTS: Record<RoleKey, Permission[]> = {
  SUPER_ADMIN: ALL.filter((p) => p !== "portal:access"),
  LAWYER: [
    ...PRACTICE,
    "client:export", "case:delete", "document:delete",
    "billing:read", "billing:write", "report:read", "report:export",
  ],
  STAFF: PRACTICE,
  ACCOUNTANT: [
    "dashboard:view", "client:read", "case:read",
    "billing:read", "billing:write",
    "report:read", "report:export", "report:financial",
    "document:read",
  ],
  CLIENT: ["portal:access"],
};

export const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Administrator",
  LAWYER: "Lawyer",
  STAFF: "Staff",
  ACCOUNTANT: "Accountant",
  CLIENT: "Client",
};
