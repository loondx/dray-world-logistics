# DRAY-WORLD Logistics

Website and transportation management system (TMS) for DRAY-WORLD Logistics, built as a single Next.js app.

- **Public website**: home, privacy and terms pages, plus a quote request form.
- **Operations portal** (staff only): loads, clients, carriers, drivers and leads.
- **Documents**: carrier load confirmations, client rate confirmations, bills of lading and invoices, generated as
  PDFs on demand.

Live site: [dray-world.com](https://www.dray-world.com)

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 + shadcn/ui · PostgreSQL + Prisma · Zod · `@react-pdf/renderer`
· Vitest · pnpm

## Run locally

You need Node 24, pnpm (`corepack enable`) and Docker.

```bash
cp .env.example .env          # then set a database password and a storage folder outside the repo
pnpm install
docker compose up -d postgres
pnpm db:migrate:deploy        # create the database tables
pnpm db:seed                  # optional: sample data for development
pnpm admin:create             # create your first login
pnpm dev                      # http://localhost:3000
```

There are no default accounts. Every user is created with `pnpm admin:create` or from **Settings** inside the
portal.

## Commands

| Command                  | What it does                                 |
| ------------------------ | -------------------------------------------- |
| `pnpm dev`               | Start the development server                 |
| `pnpm build`             | Production build                             |
| `pnpm check`             | Formatting, lint, type check and tests       |
| `pnpm test`              | Tests (needs the Postgres container running) |
| `pnpm db:migrate`        | Create a new migration (development only)    |
| `pnpm db:migrate:deploy` | Apply pending migrations                     |
| `pnpm admin:create`      | Create an admin or reset a password          |
| `pnpm company:defaults`  | Fill empty company settings with defaults    |

## Configuration

All settings are environment variables. `.env.example` lists them with comments. Never commit a real `.env` file.

| Variable                | Needed for                                        |
| ----------------------- | ------------------------------------------------- |
| `DATABASE_URL`          | The operations portal and quote form (PostgreSQL) |
| `APP_URL`               | The public HTTPS address of the site              |
| `BLOB_READ_WRITE_TOKEN` | File storage on Vercel (company logo)             |
| `DOCUMENT_STORAGE_PATH` | File storage when self-hosting, outside the repo  |
| `SESSION_TTL_HOURS`     | Optional: how long a sign-in stays active (hours) |

## Deploy on Vercel

Every push to `main` deploys to production.

- **Website only:** leave `DATABASE_URL` unset. The public pages work; sign-in and the quote form show an
  "unavailable" message.
- **Full system:**
  1. In the Vercel project, add a **Neon** Postgres database (Storage → Neon). This sets `DATABASE_URL`.
  2. Add a **private Blob** store (Storage → Blob). This sets `BLOB_READ_WRITE_TOKEN`.
  3. Set `APP_URL` to the production address and `ENABLE_EXPERIMENTAL_COREPACK=1`.
  4. Redeploy. The build applies database migrations automatically.
  5. From your machine, against the production database, create the first admin:
     `DATABASE_URL=<production URL> pnpm admin:create`, then run `pnpm company:defaults` the same way.

The app can also be self-hosted with Docker (`Dockerfile`, `docker-compose.yml`).

## Contributing

Work on a branch, open a pull request, and make sure `pnpm check` and `pnpm build` pass. Schema changes need a
migration (`pnpm db:migrate`) and an entry in [docs/MIGRATIONS.md](docs/MIGRATIONS.md).

Staff guide for the portal: [docs/TMS-GUIDE.md](docs/TMS-GUIDE.md).

## License

Proprietary. All rights reserved.
