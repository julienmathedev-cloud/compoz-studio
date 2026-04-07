/**
 * @file packages/core/src/domain/demo/use-cases/find-reusable-demo-sandbox.ts
 * @layer core/domain
 * @description
 * Use-case : résout une sandbox démo existante et réutilisable à partir de son
 * `demoInstanceId`.
 *
 * @remarks
 * - Vérifie l'existence de la sandbox.
 * - Vérifie qu'elle n'est pas expirée.
 * - Vérifie la cohérence minimale avec le user démo associé.
 * - Ne gère pas les cookies HTTP ni l'ouverture de session.
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

import type {
  FindReusableDemoSandboxDeps,
  FindReusableDemoSandboxInput,
  FindReusableDemoSandboxResult,
} from "@compoz/core/domain/demo/use-cases/find-reusable-demo-sandbox.types";

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

function isExpired(expiresAt: string, nowIso: string): boolean {
  return Date.parse(expiresAt) <= Date.parse(nowIso);
}

export function findReusableDemoSandbox({
  demoSandboxes,
  users,
  nowIso = () => new Date().toISOString(),
}: FindReusableDemoSandboxDeps) {
  return async function run(
    input: FindReusableDemoSandboxInput,
  ): Promise<FindReusableDemoSandboxResult> {
    const demoInstanceId = assertNonEmptyTrimmed(input.demoInstanceId, [
      "demoInstanceId",
    ]);

    await demoSandboxes.ensureBase();
    await users.ensureBase();

    const sandbox = await demoSandboxes.readByDemoInstanceId(demoInstanceId);

    if (!sandbox) {
      throw new DomainError({
        code: EC.NOT_FOUND,
        message: EC.NOT_FOUND,
        details: {
          path: ["demoInstanceId"],
          meta: { demoInstanceId },
        },
      });
    }

    const now = nowIso();

    if (isExpired(sandbox.expiresAt, now)) {
      throw new DomainError({
        code: EC.FORBIDDEN,
        message: EC.FORBIDDEN,
        details: {
          path: ["expiresAt"],
          meta: {
            demoInstanceId,
            expiresAt: sandbox.expiresAt,
            now,
            reason: "DEMO_SANDBOX_EXPIRED",
          },
        },
      });
    }

    const user = await users.readById(sandbox.userId);

    if (!user) {
      throw new DomainError({
        code: EC.NOT_FOUND,
        message: EC.NOT_FOUND,
        details: {
          path: ["userId"],
          meta: {
            demoInstanceId,
            userId: sandbox.userId,
            reason: "DEMO_SANDBOX_USER_NOT_FOUND",
          },
        },
      });
    }

    if (!user.demo?.isDemo) {
      throw new DomainError({
        code: EC.FORBIDDEN,
        message: EC.FORBIDDEN,
        details: {
          path: ["user", "demo", "isDemo"],
          meta: {
            demoInstanceId,
            userId: user.id,
            reason: "DEMO_SANDBOX_USER_NOT_MARKED_AS_DEMO",
          },
        },
      });
    }

    if (user.demo.demoInstanceId !== sandbox.demoInstanceId) {
      throw new DomainError({
        code: EC.FORBIDDEN,
        message: EC.FORBIDDEN,
        details: {
          path: ["user", "demo", "demoInstanceId"],
          meta: {
            demoInstanceId,
            userId: user.id,
            sandboxDemoInstanceId: sandbox.demoInstanceId,
            userDemoInstanceId: user.demo.demoInstanceId,
            reason: "DEMO_SANDBOX_INSTANCE_MISMATCH",
          },
        },
      });
    }

    if (user.rbac.defaultTenantId !== sandbox.tenantId) {
      throw new DomainError({
        code: EC.FORBIDDEN,
        message: EC.FORBIDDEN,
        details: {
          path: ["user", "rbac", "defaultTenantId"],
          meta: {
            demoInstanceId,
            userId: user.id,
            sandboxTenantId: sandbox.tenantId,
            userDefaultTenantId: user.rbac.defaultTenantId,
            reason: "DEMO_SANDBOX_TENANT_MISMATCH",
          },
        },
      });
    }

    return {
      sandbox,
      user,
      tenantId: sandbox.tenantId,
    };
  };
}
