# LegalDesk — Database Design

PostgreSQL + Prisma. The authoritative definition is `prisma/schema.prisma`; this document explains the intent behind it.

## Conventions
- Primary keys: `String @id @default(cuid())`.
- Human-readable codes come from a `Sequence(name, year, value)` table, incremented with `UPDATE … RETURNING` inside a transaction:
  - Client `CL-2026-00001`, Case `CASE-2026-0001`, Invoice `INV-2026-0001`, Receipt `RCPT-2026-0001`
- Timestamps: `createdAt`, `updatedAt`, all stored in UTC (`timestamptz`).
- Soft delete: `deletedAt DateTime?` on Client, Case, Document, Task, Invoice, Appointment. Default queries filter on `deletedAt IS NULL`.
- Money: `Int` minor units (paise/cents) plus `FirmSettings.currency`.
- Configurable lookups are tables, not enums: `CaseType`, `CaseStatus`, `HearingType`, `PracticeArea`, `Court`, `Judge`.
- Fixed workflow states are Prisma enums: task status, deadline status, hearing status, notification status, and so on.

## Entity map
```
User ─┬─ Session, PasswordResetToken
      ├─ role → Role ── RolePermission ── Permission
      └─ clientId? → Client           (for CLIENT portal users)

Client ── ClientContact[]  (emergency / additional contacts)
   └── Case[] ──┬── CaseAssignment[] (user, role: LEAD | ASSOCIATE | STAFF)
                ├── Hearing[]  (self-relation: previousHearing → nextHearing)
                ├── Deadline[]
                ├── Task[] ── TaskComment[]
                ├── CaseNote[] (visibility INTERNAL | SHARED)
                ├── Communication[]
                ├── Document[] ── DocumentVersion[]
                ├── Invoice[] ── InvoiceItem[], Payment[]
                ├── Expense[]
                ├── CaseContact[] (opposite party, counsel, witnesses)
                └── TimelineEvent[] (append-only)

Court ── Judge[];  Case.courtId, Case.judgeId
Appointment (client, lawyer, optional case)
CalendarEvent: a derived feed, not stored. The calendar queries hearings, deadlines,
   appointments, tasks and meetings directly to avoid duplicated state.
   A `Meeting` table holds internal meetings that belong to no other entity.
Reminder (polymorphic: entityType + entityId, dueAt, offsetLabel, status)
Notification (userId, channel, status, providerMessageId, deliveredAt)
AuditLog (append-only)
FirmSettings (singleton), BackupRecord, RateLimit, Sequence
AIConversation ── AIMessage[]
```

## Key indexes
| Table | Index |
|---|---|
| Client | `code` unique, `phone`, `email`, `(lastName, firstName)`, `assignedLawyerId`, `deletedAt` |
| Case | `code` unique, `caseNumber`, `clientId`, `statusId`, `courtId`, `leadLawyerId`, `(priority, statusId)` |
| Hearing | `(date)`, `caseId`, `(lawyerId, date)`, `status` |
| Deadline | `(dueAt)`, `caseId`, `(assigneeId, dueAt)`, `status` |
| Task | `(assigneeId, status, dueAt)`, `caseId` |
| Appointment | `(lawyerId, startAt)`, `clientId` |
| Document | `caseId`, `clientId`, `type`, `deletedAt` |
| Reminder | `(status, dueAt)` for the cron scan |
| Notification | `(userId, readAt)` |
| AuditLog | `(entityType, entityId)`, `actorId`, `createdAt` |
| Invoice | `number` unique, `(status, dueDate)`, `clientId` |

Global search uses `pg_trgm` GIN indexes on client names, case title/number, and document titles (added through a raw SQL migration).

## Integrity rules
- Foreign keys use `onDelete: Restrict` for business records (a client with cases can't be hard-deleted) and `Cascade` only for pure children (InvoiceItem, DocumentVersion, TaskComment).
- Completing a hearing with a next date runs in **one transaction**: update the hearing → create the next hearing linked through `previousHearingId` → timeline events → reminders → audit log.
- An invoice's `paidAmount` is recomputed from `Payment` rows in the same transaction; status is derived (`DRAFT/SENT/PARTIALLY_PAID/PAID/OVERDUE/VOID`).
