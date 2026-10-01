# DRAY-WORLD LOGISTICS — Website & TMS

One Next.js application containing:

- **Public website** — `src/app/(marketing)` (full site is Phase 7; an interim page is live now)
- **Private Transportation Management System** — `src/app/(dashboard)`: loads, clients, carriers, drivers, documents
- **Document generation** — Carrier Load Confirmation, Customer Rate Confirmation and Bill of Lading PDFs,
  laid out after the client's reference documents; POD/COD and other uploads; full version history

Deployed as a modular monolith on one Linux VPS: `Nginx → Next.js → PostgreSQL`, with generated and uploaded
documents on private disk storage.

> Company address (confirmed by the client): 9 Nom Crescent Unit 2, Markham, ON L3S 2B3, Canada. Phone, email,
> MC/DOT numbers, logo and document terms are entered by staff under **Settings** — nothing is invented.

## Tech stack

| Concern         | Choice                                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| Framework       | Next.js 16.3 (App Router, Server Components, Server Actions, Turbopack)        |
| Language        | TypeScript 5.9 (strict)                                                        |
| UI              | Tailwind CSS 4, shadcn/ui (Radix), lucide icons                                |
| Database        | PostgreSQL 16 (self-hosted, Docker) via Prisma ORM 7.10 + `@prisma/adapter-pg` |
| Validation      | Zod 4                                                                          |
| Auth            | Argon2id passwords, opaque DB-backed sessions, HTTP-only cookies               |
| PDF             | `@react-pdf/renderer`                                                          |
| Tests           | Vitest (unit + integration against a real `_test` database)                    |
| Package manager | pnpm 11                                                                        |

All production dependencies are pinned to exact versions. Prisma is pinned to 7.10.0 (the npm `latest` tag
currently points at an 8.0 release candidate, which is intentionally not used).

## Project layout

```
src/
  app/
    (marketing)/        public website — must not import TMS business logic
    (auth)/login/       sign-in
    (dashboard)/        internal TMS (every page calls requireUser/requirePermission)
    api/                route handlers (health, document download/upload)
  components/           ui/ (shadcn), brand/, auth/, dashboard/, …
  config/               company-defaults.ts — the only place company details appear in code
  features/<domain>/    server actions + zod schemas per domain
  generated/prisma/     generated Prisma client (git-ignored)
  lib/                  auth/ (pure crypto helpers), db/, env.ts, logger.ts, labels/
  server/               server-only: auth/, audit/, permissions/, services/, repositories/
  proxy.ts              optimistic cookie check (NOT the security boundary)
prisma/                 schema.prisma, migrations/, seed.ts (dev-only)
scripts/                create-admin.ts
tests/                  unit/, integration/, support/
```

## Local development

Prerequisites: Node 24+, pnpm 11 (`corepack enable`), Docker.

```bash
cp .env.example .env
# edit .env: set POSTGRES_PASSWORD (and the same password in DATABASE_URL),
# DATA_ROOT and DOCUMENT_STORAGE_PATH to a directory OUTSIDE the repo, e.g.
#   DATA_ROOT=/home/<you>/.local/share/dray-world
#   DOCUMENT_STORAGE_PATH=/home/<you>/.local/share/dray-world/documents
mkdir -p "$DATA_ROOT/documents" "$DATA_ROOT/backups"

pnpm install                 # also generates the Prisma client
docker compose up -d postgres
pnpm db:migrate:deploy       # apply migrations
pnpm db:seed                 # optional: fictitious sample clients/carriers (refuses in production)
pnpm admin:create            # create your login (prompts for email, name, password)
pnpm dev                     # http://localhost:3000 → /login
```

### Commands

| Command                  | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `pnpm dev`               | development server                                         |
| `pnpm build`             | production build (standalone output)                       |
| `pnpm start`             | run the standalone production build                        |
| `pnpm check`             | format check + lint + typecheck + tests                    |
| `pnpm test`              | all tests (needs the Postgres container running)           |
| `pnpm format`            | Prettier                                                   |
| `pnpm db:migrate`        | **development only**: create/apply a new migration         |
| `pnpm db:migrate:deploy` | apply pending migrations (production path)                 |
| `pnpm db:seed`           | development sample data                                    |
| `pnpm admin:create`      | create an admin, or `--reset-password` for an existing one |

Integration tests use a separate database named `<POSTGRES_DB>_test` (created and migrated automatically);
they never touch the development database.

## Environment variables

See `.env.example`. Server-only; nothing is exposed with `NEXT_PUBLIC_`.

| Variable                                              | Notes                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`                                        | host-side connection (Compose overrides the host to `postgres`)   |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres container credentials                                    |
| `POSTGRES_HOST_PORT`                                  | bound to `127.0.0.1` only                                         |
| `APP_URL`                                             | public base URL                                                   |
| `SESSION_TTL_HOURS`                                   | idle timeout (sliding); sessions also expire 7 days after sign-in |
| `DOCUMENT_STORAGE_PATH`                               | private document root when running on the host                    |
| `MAX_DOCUMENT_SIZE_MB`                                | upload limit                                                      |
| `DATA_ROOT`                                           | Docker bind-mount root: `postgres/`, `documents/`, `backups/`     |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`      | optional, only read by `pnpm admin:create`                        |

There is no `SESSION_SECRET`: sessions are random opaque tokens and only their SHA-256 hash is stored, so no
signing key is needed.

## Authentication design

- Passwords: Argon2id (19 MiB, t=2, p=1). Minimum 12 characters.
- Sign-in creates a 256-bit random token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` and `__Host-`
  prefixed in production). The database stores only `sha256(token)`.
- Sliding idle timeout (`SESSION_TTL_HOURS`) plus a 7-day absolute limit; deactivating a user ends their sessions.
- 5 failed attempts for an email within 15 minutes blocks further attempts for that window (tracked in `AuditLog`).
- Enforcement is server-side: `requireUser()` / `requirePermission()` in every dashboard layout, page and server
  action; route handlers check the session themselves. `src/proxy.ts` only redirects cookie-less visitors early.
- Roles (`ADMIN`, `OPERATIONS`, `DISPATCHER`, `ACCOUNTING`, `READ_ONLY`) map to permissions in
  `src/server/permissions/permissions.ts`; code checks permissions, never roles.

### First admin

There are no default credentials. Create the first administrator with the CLI:

```bash
pnpm admin:create --email you@company.com --name "Your Name"          # on the host
docker compose --profile tools run --rm tools pnpm admin:create \
  --email you@company.com --name "Your Name"                          # on the server
```

Forgotten password: `pnpm admin:create --email you@company.com --reset-password` (also signs out all sessions).

## Database

- Migrations live in `prisma/migrations` and are committed. Development: `pnpm db:migrate`. Production: always
  `prisma migrate deploy` (via the `tools` container). Never `db push` against production.
- Load numbers come from a PostgreSQL sequence starting at **100001** (`Load_loadNumber_seq`), with a UNIQUE
  constraint. Gaps are possible when a transaction rolls back; numbers are never reused.
- Money is `NUMERIC(12,2)`. Appointment dates are `DATE` columns and appointment times are facility-local text,
  so no time-zone conversion can move a pickup date.

### Migration log

| Migration                                  | Change                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260930144801_init`                      | Initial schema: users/sessions, company settings, clients, carriers, drivers, loads, status history, documents, audit log, quote requests; load number sequence starts at 100001                                                                                              |
| `20260930151940_simplify_load_fields`      | Load form simplified: container type/size → `equipmentType`/`equipmentSize`; single times → `pickupTimeFrom/To`, `deliveryTimeFrom/To`; pickup/delivery contacts; dispatch/operations notes → `internalNotes`; index on `createdAt`; company province corrected to ON, Canada |
| `20260930152513_driver_last_name_optional` | `Driver.lastName` becomes optional                                                                                                                                                                                                                                            |
| `20261001014714_quote_callback_requests`   | Website leads: `QuoteRequest.kind` (`QUOTE` / `CALLBACK`) and `preferredTime` for "call me back" requests; `email` and `serviceType` become optional (call-backs only need a name and phone)                                                                                  |
| `20261001060653_quote_shipment_details`    | Website quote form: `QuoteRequest.equipment`, `loadCount` and `readyDate` (date only); the website no longer sends call-back requests (earlier ones stay readable)                                                                                                            |

## Using the system

1. **Settings** (admin): complete phone, email, MC/DOT, upload the logo (PNG/JPG), and paste the legally reviewed
   carrier terms / customer terms / BOL instructions. Add the other staff users here.
2. **Loads → Create load → Drayage/OTR.** Pick the client (or create it inline with **New client**), the carrier
   (**New carrier** inline) and driver (**Add driver** inline — truck/trailer fill in automatically). Previously used
   pickup/delivery facilities can be re-used with **Use saved location**. Enter client rate and carrier rate; the
   gross margin is shown live. Only client and load date are required.
3. On the load page, **Documents**: generate the Carrier Load Confirmation (carrier rate only), Customer Rate
   Confirmation (client rate only) and Bill of Lading (no rates). **Regenerate** creates v2, v3… — earlier versions
   are kept. **Upload POD / COD / other** stores signed paperwork (PDF/JPG/PNG).
4. Move the load along with **Mark …** / **Change status**; every change appears in the timeline.
5. Find any load later from **Loads** (search by load #, container #, client, carrier, driver, city; filter by
   status, type, client, carrier, dates) or **Documents**.

## Documents & rate privacy

| Document                        | Rates shown  | Never contains                                                 |
| ------------------------------- | ------------ | -------------------------------------------------------------- |
| Carrier Load Confirmation       | carrier rate | client rate, client identity/reference, margin, internal notes |
| Customer Rate Confirmation      | client rate  | carrier rate, carrier/driver, margin, internal notes           |
| Bill of Lading (`BOL-<load #>`) | none         | any rate, margin, internal notes                               |

Enforced in three layers: a per-document database `select` that does not fetch forbidden fields
(`src/lib/pdf/mappings/selects.ts`), typed DTO mappings (`src/lib/pdf/mappings/*`), and tests that search the
serialized DTOs for leaked values (`tests/unit/pdf-documents.test.ts`). Rate-bearing documents can only be opened
by users with the `financials:read` permission.

**Changing a layout** only touches `src/lib/pdf/<document>/template.tsx` and the shared components in
`src/lib/pdf/components/` — never load logic. Render the three documents from fixture data for visual review with:

```bash
PDF_OUTPUT_DIR=/tmp/pdf-preview pnpm vitest run tests/unit/pdf-documents.test.ts
```

**Storage:** files live under `DOCUMENT_STORAGE_PATH` (`loads/<load #>/generated/<load #>-<type>-v<N>.pdf`,
`loads/<load #>/uploads/<random>.<ext>`), never in `public/`. Downloads go through
`/api/documents/<id>/download`, which checks the session and permissions, looks the file up by database id and
verifies the path stays inside the storage root. Uploads are identified by content (magic bytes), not by name or
browser-supplied type. Deleting a document hides it (reason + audit entry); the file is retained.

## Docker / deployment (summary — full guide in Phase 8)

```
/opt/dray-world/        repository checkout + .env
/data/dray-world/
  postgres/             PostgreSQL data (bind mount)
  documents/            generated + uploaded documents (bind mount, owned by uid 1001)
  backups/              database + document backups
```

```bash
sudo mkdir -p /data/dray-world/{postgres,documents,backups}
sudo chown 1001:1001 /data/dray-world/documents        # app container runs as uid 1001
docker compose build
docker compose up -d postgres
docker compose --profile tools run --rm tools          # prisma migrate deploy
docker compose up -d app                               # listens on 127.0.0.1:3000 for Nginx
```

- Only Nginx (80/443) is public. PostgreSQL and the app bind to `127.0.0.1`.
- Containers restart automatically (`unless-stopped`) and have health checks (`/api/health`).
- Rebuilding or replacing containers never touches `/data/dray-world`.

Nginx/HTTPS configuration, backup/restore scripts and the upgrade procedure arrive in Phase 8.

## Troubleshooting

- **`Invalid server environment configuration: …`** — a required variable is missing from `.env`.
- **`Connection url is empty`** from Prisma — `DATABASE_URL` is not set in the shell/`.env`.
- **Integration tests fail to connect** — start Postgres: `docker compose up -d postgres`.
- **`EACCES` scanning `.data/postgres`** — `DATA_ROOT` points inside the repo; move it outside.
