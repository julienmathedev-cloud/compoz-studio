/**
 * @file packages/core/src/domain/demo/use-cases/find-reusable-demo-sandbox.ts
 * @layer core/domain/demo
 * @description Use case that resolves an existing reusable demo sandbox by `demoInstanceId`.
 * @remarks
 * This use case validates sandbox expiry and its consistency with the linked demo user. HTTP cookies and session opening are handled outside the core domain.
 */

import type {
  FindReusableDemoSandboxDeps,
  FindReusableDemoSandboxInput,
  FindReusableDemoSandboxResult,
} from "@compoz/core/domain/demo/use-cases/find-reusable-demo-sandbox.types";
import { assertDemoSandboxWebsiteIdentity } from "@compoz/core/domain/demo/assert-demo-sandbox-website-identity";
import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

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

    assertDemoSandboxWebsiteIdentity({
      demoInstanceId: sandbox.demoInstanceId,
      websiteId: sandbox.websiteId,
    });

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

    if (user.rbac.defaultWebsiteId !== sandbox.websiteId) {
      throw new DomainError({
        code: EC.FORBIDDEN,
        message: EC.FORBIDDEN,
        details: {
          path: ["user", "rbac", "defaultWebsiteId"],
          meta: {
            demoInstanceId,
            userId: user.id,
            sandboxWebsiteId: sandbox.websiteId,
            userDefaultWebsiteId: user.rbac.defaultWebsiteId,
            reason: "DEMO_SANDBOX_WEBSITE_MISMATCH",
          },
        },
      });
    }

    if (!user.rbac.websiteIds.includes(sandbox.websiteId)) {
      throw new DomainError({
        code: EC.FORBIDDEN,
        message: EC.FORBIDDEN,
        details: {
          path: ["user", "rbac", "websiteIds"],
          meta: {
            demoInstanceId,
            userId: user.id,
            websiteId: sandbox.websiteId,
            reason: "DEMO_SANDBOX_ACCESS_MISSING",
          },
        },
      });
    }

    const website = await demoSandboxes.readWebsiteById(sandbox.websiteId);

    if (!website || website.type !== "sandbox") {
      throw new DomainError({
        code: EC.NOT_FOUND,
        message: EC.NOT_FOUND,
        details: {
          path: ["websiteId"],
          meta: {
            demoInstanceId,
            websiteId: sandbox.websiteId,
            reason: "DEMO_SANDBOX_WEBSITE_NOT_FOUND_OR_INVALID",
          },
        },
      });
    }

    if (!website.expiresAt || isExpired(website.expiresAt, now)) {
      throw new DomainError({
        code: EC.FORBIDDEN,
        message: EC.FORBIDDEN,
        details: {
          path: ["website", "expiresAt"],
          meta: {
            demoInstanceId,
            websiteId: sandbox.websiteId,
            reason: "DEMO_SANDBOX_WEBSITE_EXPIRED",
          },
        },
      });
    }

    return {
      sandbox,
      user,
      websiteId: sandbox.websiteId,
    };
  };
}
