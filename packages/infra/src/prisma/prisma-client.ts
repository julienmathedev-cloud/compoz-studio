/**
 * @file packages/infra/src/prisma/prisma-client.ts
 * @layer infra/prisma
 *
 * @description
 * Shared Prisma Client instance used by infrastructure repositories.
 *
 * @remarks
 * In development, Next.js hot reload can re-evaluate modules multiple times.
 * Without a global cache, this may create too many PrismaClient instances.
 *
 * This file exposes a singleton Prisma client:
 * - reused across hot reloads in development,
 * - created normally in production/runtime environments.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Shared Prisma Client instance.
 *
 * @remarks
 * Repositories should import this instance instead of creating their own
 * PrismaClient. This keeps database access centralized and prevents
 * connection duplication during development.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from "@prisma/client";
