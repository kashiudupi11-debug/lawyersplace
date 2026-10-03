# Skills & Tools — LegalDesk

Reviewed 2026-10-03 (Phase 0.5). Only skills that are relevant to this project are listed. Nothing was installed without the user's approval.

## Already available (built in to this Claude Code session)
| Skill | Purpose | Installation / configuration | Where it is used |
|---|---|---|---|
| `claude-api` | Correct Anthropic SDK usage, model IDs, tool use, prompt caching | Built in | Phase 19/21–22: LegalDesk AI, daily briefing, permission-scoped tool calls |
| `code-review` | Correctness review of diffs | Built in | "Agent 9 — Code Reviewer" gate at the end of each major phase |
| `security-review` | Security review of pending changes | Built in | Auth (Phase 4), documents (13–15), portal (18), AI (19), hardening (22) |
| `simplify` | Reuse/simplification cleanup | Built in | Before each phase sign-off |
| `run` + built-in browser | Launch app, drive UI, take screenshots, check responsive views | Built in (`mcp__Claude_Browser__*`) | UI review and mobile checks after every UI phase |
| `pdf` | PDF inspection and generation reference | Built in | Verifying generated invoice/receipt PDFs (Phase 17) |
| `dataviz` | Consistent, accessible chart design | Built in | Reports (Phase 20) and dashboard KPIs |

## Recommended from the plugin catalog (install card shown to user; pending user action)
| Skill / plugin | Publisher | Purpose | Where it would be used | Status |
|---|---|---|---|---|
| `frontend-design` | Anthropic | Higher-quality UI/UX implementation | Design system (Phase 5), public site, dashboard, case workspace | Pending user install |
| `playwright` (MCP) | Microsoft | Browser automation for E2E testing | Phase 23 testing, regression checks | Pending user install |
| Axe Accessibility | Deque | WCAG scan → fix → verify loop | Phase 32 accessibility, every UI phase | Pending user install |

## Considered and not selected
| Plugin | Reason |
|---|---|
| Prisma MCP | Useful mainly for provisioning Prisma Postgres. We use the Prisma CLI directly with a hosted DB, so it isn't needed. Can be added later. |
| prism (Optra), Kobiton Testing | Third-party dashboards / mobile device clouds, not needed; avoid extra external data flows for confidential legal code. |
| securitymaxxing | Community-published, privileged hooks. The built-in `security-review` covers this need. |

## Limitations
- External services (email, SMS, WhatsApp, payments, object storage, AI) need real API keys. **No credentials will be invented**. Each integration is built behind an adapter with a safe "not configured" state.
