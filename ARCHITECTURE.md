# LegalDesk — System Architecture

Status: **Draft v1 (Phase 1)**. This is the source of truth for architectural decisions. Check here before changing structure, and record changes in `PROJECT_PROGRESS.md` → Decisions.

## 1. Shape of the system
- **One deployment = one law firm** (single-tenant). This keeps authorization simple and avoids cross-firm leakage. `FirmSettings` is a singleton row.
- **Modular monolith**: a single Next.js application. UI, server actions and route handlers share one **service layer** that owns all business rules and authorization.

```
Browser ──► Next.js (App Router)
             ├─ app/(public)      public website (SSR/SSG, SEO)
             ├─ app/(auth)        login, reset password
             ├─ app/(app)         staff/lawyer workspace  ─┐
             ├─ app/portal        client portal            ├─► Server Actions / Route Handlers
             └─ app/api/*         downloads, cron, webhooks┘          │
                                                                      ▼
                                              src/server/services/*  (business logic + authz)
                                                      │          │            │
                                                 Prisma ORM   Storage     Integrations
                                                      │       adapter    (email/SMS/WA/AI/pay)
                                                 PostgreSQL   S3/R2/local
```

## 2. Frontend
| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19.2, TypeScript strict. Note: v16 renames `middleware.ts` → `src/proxy.ts`, and request APIs (`cookies`, `params`) are async-only |
| Styling | Tailwind CSS v4 with design tokens (CSS variables) |
| Primitives | Radix UI (accessible dialogs, menus, tabs, popovers, tooltips) wrapped in our own components in `src/components/ui` |
| Icons | lucide-react (line icons, restrained) |
| Forms | react-hook-form + zod. **The same zod schema is re-validated on the server** |
| Tables | TanStack Table, server-side pagination/sorting/filtering |
| Dates | date-fns + date-fns-tz. All times are stored in UTC and shown in the firm's timezone |
| Motion | Framer Motion, used sparingly (drawers, toasts, list reveals); respects `prefers-reduced-motion` |
| Command menu | cmdk (Ctrl/Cmd+K) |
| Rendering | Server Components by default, with client components only where they're interactive. Public pages are statically generated. |

## 3. Backend
- **Server Actions** for mutations from the UI. **Route Handlers** for file download/upload, cron, webhooks, exports, and AI streaming.
- **Service layer** (`src/server/services/<domain>.ts`): every function takes `actor: SessionUser` as its first argument, and:
  1. asserts the permission (`authorize(actor, "case:update")`)
  2. scopes queries (`caseScope(actor)` returns a Prisma `where` fragment)
  3. validates input with zod
  4. performs writes in a transaction that also writes `AuditLog` and `TimelineEvent` rows.
- UI code **never** calls Prisma directly. This is what makes the AI assistant and the client portal safe, because they go through the same services.

## 4. Database
PostgreSQL (hosted: Neon/Supabase) via Prisma. See `DATABASE_DESIGN.md`.
- `DATABASE_URL` uses the pooled connection; `DIRECT_URL` is used for migrations.
- IDs: `cuid` primary keys (non-guessable), plus human-readable codes (`CL-2026-00001`, `CASE-2026-0012`, `INV-2026-0001`) generated from a `Sequence` table inside a transaction.
- Soft delete (`deletedAt`) for clients, cases, documents, tasks, and invoices. Timeline and audit rows are append-only.

## 5. Authentication
- Custom, database-backed sessions (no third-party identity provider needed; the firm owns its data).
- Passwords: argon2id (`@node-rs/argon2`).
- Session token: 32 random bytes. Only its SHA-256 hash is stored. The cookie is `__Host-ld_session`, `HttpOnly; Secure; SameSite=Lax; Path=/`.
- Expiry: 12h idle, 7d absolute. Sessions rotate on login and privilege change. Logout revokes the server row.
- Password reset: single-use random token (hash stored), 30-minute expiry, revokes all sessions on use. The response is the same whether or not the email exists.
- Rate limiting: a DB-backed sliding window (`RateLimit` table) keyed by IP+email. The account locks for 15 minutes after 5 failures. An Upstash Redis adapter is optional for scale.

## 6. Authorization
- Roles: `SUPER_ADMIN`, `LAWYER`, `STAFF`, `ACCOUNTANT`, `CLIENT`.
- **Permissions** are strings (`client:read`, `case:update`, `billing:write`, `audit:read`, …). A `Role → Permission[]` map is seeded and editable by SUPER_ADMIN.
- **Record scoping** (on top of permissions):
  - SUPER_ADMIN: everything.
  - LAWYER / STAFF: cases where they are assigned (lead lawyer, team member or staff). An optional firm setting "all lawyers see all cases" is off by default.
  - ACCOUNTANT: billing data and client contact basics. No case notes or documents unless the document type is Invoice/Receipt.
  - CLIENT: only records linked to their own `Client` row, and only items flagged `sharedWithClient`. **Internal notes are never readable.**
- Enforced in three places: `src/proxy.ts` (coarse cookie-presence redirect only), page/layout `requireUser()` checks, and **the service layer (authoritative)**.

## 7. Document storage
- `StorageAdapter` interface: `put`, `getSignedUrl`, `stream`, `delete`.
  - Production: S3-compatible (Cloudflare R2 / AWS S3), private bucket, server-side encryption.
  - Development: local directory `./.storage` **outside `public/`**, served only via an authenticated route.
- Object keys are random (`docs/<cuid>/<versionId>`). File names are stored only in the database.
- Download flow: `GET /api/documents/:id/download` → session check → service authz (role + case access + share flag) → audit log → 302 to a **60-second presigned URL** (S3), or a stream (local).
- Upload: server checks MIME by magic bytes (`file-type`), uses an allow-list (PDF, DOCX, DOC, XLSX, JPG, PNG, TXT), and a 25 MB limit (configurable). Status `PENDING_SCAN → CLEAN` uses a pluggable scanner hook (ClamAV/cloud). The default dev scanner marks files CLEAN and records that no real scan ran.
- Versioning: `Document` (logical) → `DocumentVersion[]` (immutable files). Renaming changes metadata only.

## 8. Notifications & reminders
- When a hearing, deadline, task, or appointment is created or changed, `ReminderService` generates `Reminder` rows from the configured offsets (hearings 7d/3d/1d/2h, deadlines 14d/7d/3d/1d, plus custom ones). Changing the date regenerates future reminders; already-sent ones are kept.
- `GET /api/cron/reminders` (protected by `CRON_SECRET`, run every 5 minutes by Vercel Cron or an external scheduler) picks due reminders and creates `Notification` rows per channel.
- Channel adapters: `InApp` (always), `Email` (Resend/SMTP), `SMS` and `WhatsApp` (Twilio / Meta Cloud API). Delivery status is `QUEUED → SENT → DELIVERED / FAILED`. **`DELIVERED` is only set from a provider webhook or confirmation.** An unconfigured channel is shown as "Not configured" and never as sent.

## 9. AI (LegalDesk AI)
- Provider: Anthropic Claude API (default model configurable in settings, e.g. `claude-sonnet-5-5`). Disabled unless `ANTHROPIC_API_KEY` is set.
- **Tool-use, not raw database access.** The model is given tools (`search_cases`, `get_case_summary_data`, `list_hearings`, `list_deadlines`, `list_tasks`, `search_documents`, `draft_message`, `propose_tasks`), and each tool calls the **same service functions with the current user as the actor**. Retrieval is therefore permission-aware by construction.
- Write actions (such as creating tasks) are returned as **proposals** that the user confirms in the UI. The AI never mutates data directly.
- Guardrails: the system prompt states that it is an administrative assistant and not a lawyer, that dates must only come from tool results, and that unknown facts are reported as unknown. Responses carry a fixed disclaimer.
- The daily briefing is built from **deterministic DB queries first**; the AI only rephrases that structured data. Counts and dates in the UI come from the DB, not the model.
- Conversations are stored in `AIConversation` / `AIMessage`, and each request is audit-logged.

## 10. Billing & payments
- Invoices with line items, tax and discount. Totals are computed on the server in integer minor units (paise/cents).
- Manual payment recording (Cash/UPI/Bank/Card/Cheque/Other) by authorized roles.
- Optional online gateway adapter (Razorpay/Stripe). An invoice is marked paid **only after a verified webhook signature**, never from a client redirect.
- PDFs (invoice, receipt) are generated server-side with `@react-pdf/renderer`.

## 11. Audit logging
- `AuditLog` is append-only: actor, action, entity type/id, before/after JSON (with sensitive fields redacted), IP, user agent, and timestamp.
- Written inside the same transaction as the change. Reads, downloads and exports of sensitive data are also logged.
- Only `audit:read` holders (SUPER_ADMIN) can view it. No UPDATE/DELETE path exists in code. Production guidance is to revoke UPDATE/DELETE on `AuditLog` from the app DB role.

## 12. Backups
- Primary: hosted Postgres point-in-time recovery (Neon/Supabase).
- Secondary: a scheduled `pg_dump` job (GitHub Actions or server cron) to a separate private bucket, which reports to `POST /api/backups/report` (secret-protected) → `BackupRecord`.
- The admin UI shows last backup, status and frequency. Backup deletion is not exposed in the app at all.

## 13. Deployment
- Recommended: Vercel (app + cron) + Neon (Postgres) + Cloudflare R2 (documents) + Resend (email).
- Alternative: Node server/VPS (`next start`) with system cron.
- Security headers: CSP, HSTS, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, set in `next.config`.
- Private routes are `noindex` and disallowed in `robots.txt`.

## 14. Directory layout
```
prisma/            schema.prisma, migrations, seed.ts
src/app/           routes (public), (auth), (app), portal, api
src/components/ui  design-system primitives
src/components/*   domain components
src/server/auth    session, password, rate limit, permissions
src/server/services domain services (authoritative authz)
src/server/integrations storage, email, sms, whatsapp, ai, payments
src/lib/           shared utils, zod schemas, formatting
tests/unit  tests/integration  tests/e2e
```
