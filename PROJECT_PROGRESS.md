# Project Progress — LegalDesk (Legal Practice Management Platform)

_Last updated: 2026-10-03_

## Current phase
**Phase 4 complete (auth verified against a real DB).** Next: app shell → Phase 6 public website → Phase 7 dashboard.

### Phase 3/4 verification (2026-10-03)
- Local Prisma Postgres (`prisma dev`, instance `legaldesk`, port 51214) — no external account; data stays on this PC. `npm run db:start` after a reboot.
- Migration `init` applied; seed loaded 5 roles, 34 permissions, 5 demo users, 10 statuses, 8 practice areas.
- Wrong password → generic error ✓ · correct password → session + redirect to `/dashboard` ✓ · cookie HttpOnly (not readable by JS) ✓ · token stored only as SHA-256 hash, 7-day expiry ✓ · audit rows for failed and successful logins ✓ · server-side revocation invalidates the cookie ✓ · 5 failures → 15-minute lockout, even with correct password ✓
- Bug found and fixed: React 19 resets forms after an action, so a failed login cleared the email. The action now echoes the email back and focuses the password field.

## Environment (Phase 0)
| Item | Finding |
|---|---|
| OS | Windows 10 Home Single Language (10.0.19045) |
| Node.js | 24.19.0 LTS (installed via winget, user-approved) · npm 11.17 |
| Framework | Next.js **16.3.8** · React 19.2 · TypeScript 5.9 · Tailwind v4 |
| ORM | Prisma **7.10** (new `prisma.config.ts`, `prisma-client` generator → `src/generated/prisma`, `@prisma/adapter-pg`) |
| Database | Hosted Postgres (Neon/Supabase) — **user to provide connection string** |
| Git | Repo initialised on `main` (no commits yet) |
| Claude Code | `.claude/launch.json` added for the dev-server preview |

## Completed
- [x] Phase 0 — environment inspected; greenfield project
- [x] Phase 0.5 — skills reviewed → `SKILLS_USED.md`; frontend-design, playwright and Axe plugins suggested for user install
- [x] Phase 1 — `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `SECURITY.md`, `PROJECT_ARCHITECTURE.md`
- [x] Phase 3 (code) — full Prisma schema (all core models), validated; client generated
- [x] Phase 3 — idempotent seed: roles, permissions, lookups (statuses, case/hearing types, practice areas), placeholder firm settings, 5 demo staff accounts
- [x] Phase 4 (code) — argon2id passwords; DB sessions (hashed token, idle 12h / absolute 7d); login with IP+email rate limits and 15-min lockout; logout; password reset (single-use, 30 min, revokes sessions, no account enumeration); open-redirect-safe `next` param; `proxy.ts` optimistic redirect; DAL guards (`requireUser`, `requireStaff`, `requirePortalUser`, `authorize`); record scoping (`caseScope`, `clientScope`); append-only audit helper; sequence codes
- [x] Phase 5 (foundation) — design tokens (navy / charcoal / warm white / brass), Newsreader + Geist type, Button, Input/Textarea/Select/Field, Card, Badge, Dialog (bottom sheet on mobile), Drawer, Menu, Tooltip, Tabs, Table, EmptyState, Skeleton, Callout, Kbd, Toaster, PageHeader, Avatar
- [x] Security headers (CSP, XFO, nosniff, Referrer-Policy, Permissions-Policy, HSTS in prod)
- [x] Gate checks: `tsc` ✓ · `eslint` ✓ · `next build` ✓ · login page reviewed at desktop and mobile widths, no console errors

## Current issues / blockers
1. Production still needs a hosted Postgres (`DATABASE_URL`/`DIRECT_URL`); development uses the local instance.
2. The lockout message reveals that an account exists (an attacker needs 5 attempts per email to learn this). Accepted trade-off for clear UX; revisit in Phase 22 hardening.
3. `/dashboard` is not built yet (404 after login). No logout button until the app shell exists.
4. Password-reset flow not yet exercised end to end (will be covered by integration tests).
5. Email provider not configured. In development, password-reset links are printed to the server console; in production the request is logged with status `NOT_CONFIGURED`.

## Next steps
1. Write the first integration tests (auth, reset, scoping).
2. Phase 5 completion → app shell (sidebar, top bar, Ctrl+K placeholder) → Phase 6 public website → Phase 7 dashboard.

## Decisions made
| # | Decision | Reason |
|---|---|---|
| D1 | Next.js 16 App Router + TypeScript | Latest stable from `create-next-app`; follow the bundled v16 docs |
| D2 | Hosted PostgreSQL + Prisma 7 | No local DB/Docker; closest to production |
| D3 | npm | Bundled with Node |
| D4 | Single-firm deployment | Simpler and safer authorization; no cross-tenant risk |
| D5 | Custom DB-backed sessions (no auth library) | Full control of revocation, lockout and audit; firm owns its data |
| D6 | Service layer is the only place that enforces authorization | UI, portal and AI all reuse it, so none can bypass access control |
| D7 | Deadline "Upcoming / Due today / Overdue" are derived, not stored | Can never go stale |
| D8 | Identity numbers stored as type + last 4 digits only | Minimises sensitive data held |
| D9 | Notification `DELIVERED` and invoice `PAID` (gateway) only set from verified provider callbacks | Prompt's "no fake success" rule |
| D10 | Native `<select>` for dropdown fields | Accessible and uses the platform picker on mobile |
| D11 | npm `allowScripts` approved only for prisma, @prisma/engines, esbuild, unrs-resolver | npm 11 blocks install scripts by default |
| D12 | Local Prisma Postgres (`prisma dev`) for development | User asked Claude to create the DB; avoids creating third-party accounts and keeps data local |

## Environment / configuration requirements
See `.env.example`. Currently required: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `CRON_SECRET`, `BACKUP_REPORT_SECRET`, `DEMO_PASSWORD` (dev). The last four are already generated in your local `.env`.
