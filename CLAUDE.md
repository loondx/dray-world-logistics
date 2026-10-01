@AGENTS.md

# Project rules (DRAY-WORLD TMS)

- Modular monolith: one Next.js app. Marketing (`src/app/(marketing)`) must not import TMS services beyond the
  public company profile.
- Every dashboard page, server action and route handler authorizes itself (`requireUser` / `requirePermission`
  from `src/server/auth/guards.ts`). Layout checks alone are not enough; `src/proxy.ts` is only an optimistic check.
- Company details live only in `src/config/company-defaults.ts` (seed) and the `CompanySettings` row. Never
  hardcode them elsewhere; never invent phone/email/MC/DOT/terms.
- External documents (PDFs) receive dedicated DTOs only — never Prisma objects. Carrier documents must never
  contain `clientRate`; shipper documents must never contain `carrierRate`, margin or internal notes.
- Money: `Decimal(12,2)` + decimal.js; no floating-point arithmetic.
- Dates: appointment dates are `@db.Date`, times are facility-local strings — never convert time zones.
- Documents are stored under `DOCUMENT_STORAGE_PATH`, never in `public/`.
- Schema changes: `pnpm db:migrate` (dev) and record the migration in the README migration log.
- Before finishing: `pnpm check` and `pnpm build` must pass.
