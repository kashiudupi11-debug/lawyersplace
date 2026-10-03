# Project Architecture — Overview

Short overview. Full details: [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE_DESIGN.md](DATABASE_DESIGN.md), [SECURITY.md](SECURITY.md).

- **Product**: LegalDesk, a single-firm legal practice management platform (public site + staff workspace + client portal + AI assistant).
- **Stack**: Next.js 15 · React 19 · TypeScript · Tailwind v4 · Radix UI · Prisma · PostgreSQL (hosted) · Anthropic Claude API · S3-compatible storage · Vitest · Playwright.
- **Core principle**: all reads and writes go through `src/server/services`, which enforce permission and record scope for the acting user. UI pages, the client portal and the AI assistant all use these services, so none of them can bypass access control.
- **Integrations** (email, SMS, WhatsApp, storage, AI, payments) live behind adapters. Each one reports "Not configured" until real credentials are supplied; none fakes success.
