/**
 * @file packages/infra/src/prisma/prisma-client.ts
 * @layer infra/prisma
 * @description Shared Prisma Client singleton for infrastructure repositories.
 * @remarks
 * Prisma 7 requires a PostgreSQL driver adapter; development uses a global cache to survive Next.js hot reloads.
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from "@compoz/infra/prisma/generated";
