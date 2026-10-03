# LegalDesk — Security Model

Legal data is treated as **highly confidential**. The rule: _deny by default, authorize on the server, log sensitive access._

## Threats & controls
| Threat | Control |
|---|---|
| Credential stuffing / brute force | argon2id hashes; DB-backed rate limit (IP + email); 15-minute lockout after 5 failures; generic error messages |
| Session theft | `__Host-` HttpOnly, Secure, SameSite=Lax cookie; only a hash of the token is stored; idle + absolute expiry; rotation on login; server-side revocation |
| CSRF | SameSite cookies; built-in Origin check on Next.js Server Actions; explicit Origin/Host check on mutating route handlers |
| XSS | React escaping; no `dangerouslySetInnerHTML` for user content; strict CSP; AI output rendered as sanitized markdown |
| SQL injection | Prisma parameterized queries only; the few raw queries (search) use `Prisma.sql` tagged templates |
| IDOR / horizontal access | Every service call scopes by actor (`caseScope`, `clientScope`); non-guessable cuid IDs; **tests prove one client cannot read another's data** |
| Privilege escalation | Permission checks in services, not UI; role changes require `user:manage`, are audited, and revoke the target's sessions |
| Document leakage | Private bucket, random object keys, auth-checked download route, 60-second presigned URLs, audit on every download, `sharedWithClient` flag for portal |
| Malicious uploads | Magic-byte MIME check, allow-list, size limit, scanner hook, `Content-Disposition: attachment`, no inline HTML/SVG rendering |
| AI data exfiltration | AI tools call permission-scoped services as the user; no raw DB/SQL tool; write actions are proposals; prompt-injection text in documents is treated as data |
| Secrets exposure | Secrets only in server env vars (never `NEXT_PUBLIC_`); `.env*` git-ignored; `.env.example` holds names only |
| Audit tampering | Append-only in code; recommendation to revoke DB UPDATE/DELETE on `AuditLog`; only SUPER_ADMIN can read it |
| Fake delivery/payment states | Delivered/paid statuses are only set from verified provider webhooks |

## Role capability matrix (defaults; editable by SUPER_ADMIN)
| Capability | SUPER_ADMIN | LAWYER | STAFF | ACCOUNTANT | CLIENT |
|---|---|---|---|---|---|
| Clients: read/write | all | assigned | assigned | read basic | own (read) |
| Cases: read/write | all | assigned | assigned (no delete) | read basic | own (read, shared fields) |
| Internal notes | ✓ | ✓ | ✓ | ✗ | ✗ |
| Documents | all | assigned | assigned | invoices/receipts | shared only |
| Billing write | ✓ | ✓ | ✗ | ✓ | ✗ |
| Reports / exports | ✓ | own workload | ✗ | financial | ✗ |
| Users, roles, settings | ✓ | ✗ | ✗ | ✗ | ✗ |
| Audit log | ✓ | ✗ | ✗ | ✗ | ✗ |
| Backups (view) | ✓ | ✗ | ✗ | ✗ | ✗ |

## Required headers
`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation off).

## Operational checklist (production)
- [ ] Strong `AUTH_SECRET`, `CRON_SECRET`, `BACKUP_REPORT_SECRET` (32+ random bytes)
- [ ] Database user without superuser rights; UPDATE/DELETE on `AuditLog` revoked
- [ ] Bucket private, SSE enabled, CORS restricted to app origin
- [ ] Demo accounts removed or passwords rotated
- [ ] Backups verified with a test restore
