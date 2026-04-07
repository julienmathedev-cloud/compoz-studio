/**
 * @file packages/core/src/domain/demo/use-cases/create-demo-sandbox-from-seed.ts
 * @layer core/domain
 * @description
 * Use-case : crée une nouvelle sandbox démo isolée à partir d’un tenant seed.
 *
 * @remarks
 * - Crée une sandbox entièrement nouvelle.
 * - Ne gère pas la réutilisation d’une sandbox existante.
 * - Ne gère pas les cookies ni la session HTTP.
 * - Le tenant sandbox reste un simple scope technique identifié par `tenantId`.
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

import type { User } from "@compoz/core/domain/users/entities/user";

import type {
  CreateDemoSandboxFromSeedDeps,
  CreateDemoSandboxFromSeedInput,
  CreateDemoSandboxFromSeedResult,
} from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";

function assertNonEmptyTrimmed(
  value: unknown,
  path: string[],
  code: ErrorCode = EC.INVALID_ARGUMENT,
): string {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new DomainError({
      code,
      message: code,
      details: { path },
    });
  }

  return normalized;
}

function assertIsoDateString(
  value: unknown,
  path: string[],
  code: ErrorCode = EC.INVALID_ARGUMENT,
): string {
  const normalized = String(value ?? "").trim();

  if (!normalized || Number.isNaN(Date.parse(normalized))) {
    throw new DomainError({
      code,
      message: code,
      details: { path },
    });
  }

  return normalized;
}

function buildDemoTenantId(demoInstanceId: string): string {
  return `demo-${demoInstanceId}`;
}

function buildDemoUserEmail(demoInstanceId: string): string {
  return `demo+${demoInstanceId}@compoz.local`;
}

function buildDemoUserName(): string {
  return "Demo User";
}

function buildDemoUser(args: {
  userId: string;
  demoInstanceId: string;
  tenantId: string;
  now: string;
  expiresAt: string;
}): User {
  return {
    id: args.userId,
    email: buildDemoUserEmail(args.demoInstanceId),
    name: buildDemoUserName(),
    status: "active",
    rbac: {
      role: "editor",
      tenantIds: [args.tenantId],
      defaultTenantId: args.tenantId,
    },
    meta: {
      createdAt: args.now,
      updatedAt: args.now,
    },
    demo: {
      isDemo: true,
      demoInstanceId: args.demoInstanceId,
      expiresAt: args.expiresAt,
    },
  };
}

export function createDemoSandboxFromSeed({
  users,
  idGenerator,
  seedReader,
  sandboxCloner,
  passwordBuilder,
  nowIso = () => new Date().toISOString(),
}: CreateDemoSandboxFromSeedDeps) {
  return async function run(
    input: CreateDemoSandboxFromSeedInput,
  ): Promise<CreateDemoSandboxFromSeedResult> {
    const seedTenantId = assertNonEmptyTrimmed(input.seedTenantId, [
      "seedTenantId",
    ]);

    const expiresAt = assertIsoDateString(input.expiresAt, ["expiresAt"]);
    const now = nowIso();

    await users.ensureBase();

    const seedSnapshot = await seedReader.readSeedSnapshot(seedTenantId);

    const resolvedSeedTenantId = assertNonEmptyTrimmed(seedSnapshot.tenantId, [
      "seedReader",
      "tenantId",
    ]);

    const demoInstanceId = idGenerator.nextId();
    const tenantId = buildDemoTenantId(demoInstanceId);
    const userId = idGenerator.nextId();

    const user = buildDemoUser({
      userId,
      demoInstanceId,
      tenantId,
      now,
      expiresAt,
    });

    const password = passwordBuilder.buildDemoUserPassword(demoInstanceId);

    await users.create({
      user,
      password,
    });

    try {
      await sandboxCloner.cloneSeedToTenant({
        sourceTenantId: resolvedSeedTenantId,
        targetTenantId: tenantId,
      });
    } catch (error) {
      await users.deleteById(user.id).catch(() => undefined);

      throw error;
    }

    return {
      demoInstanceId,
      tenantId,
      user,
    };
  };
}
