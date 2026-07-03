/**
 * @file packages/infra/src/prisma/prisma-client.ts
 * @layer infra/prisma
 *
 * @description
 * Shared Prisma Client instance used by infrastructure repositories.
 *
 * @remarks
 * In Prisma 7, PostgreSQL connections require a driver adapter.
 *
 * In development, Next.js hot reload can re-evaluate modules multiple times.
 * Without a global cache, this may create too many PrismaClient instances.
 *
 * This file exposes a singleton Prisma client:
 * - reused across hot reloads in development,
 * - created normally in production/runtime environments.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@compoz/infra/prisma/generated";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create PrismaClient.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Shared Prisma Client instance.
 *
 * @remarks
 * Repositories should import this instance instead of creating their own
 * PrismaClient. This keeps database access centralized and prevents
 * connection duplication during development.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from "@compoz/infra/prisma/generated";
