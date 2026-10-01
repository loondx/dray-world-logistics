import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

import { createPrismaClient } from "./create-client";

// Reuse a single client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient(getEnv().DATABASE_URL);
  return globalForPrisma.prisma;
}

// Created lazily on first use, so importing this module (e.g. while `next build`
// collects page data) never requires runtime configuration to be present.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value: unknown = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type { Prisma } from "@/generated/prisma/client";
export type DbTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
