# syntax=docker/dockerfile:1
#
# Targets:
#   runner  production Next.js server (standalone output, non-root)
#   tools   Prisma CLI + scripts for `migrate deploy` and admin bootstrap

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ── Dependencies ────────────────────────────────────────────
FROM base AS deps
# openssl is required by the Prisma schema engine (migrations).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ── Build ───────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm build

# ── Tools (migrations, admin bootstrap) ─────────────────────
FROM deps AS tools
ENV NODE_ENV=production
COPY . .
CMD ["pnpm", "db:migrate:deploy"]

# ── Runtime ─────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app \
    && mkdir -p /data/documents && chown app:app /data/documents

COPY --from=builder --chown=app:app /app/.next/standalone ./

USER app
EXPOSE 3000
CMD ["node", "server.js"]
