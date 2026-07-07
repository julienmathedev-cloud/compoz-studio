/**
 * @file packages/core/src/domain/demo/use-cases/register-demo-sandbox.ts
 * @layer core/domain/demo
 * @description Use case that stores the resolution record for a demo sandbox.
 * @remarks
 * This use case runs after sandbox creation and intentionally leaves cloning, HTTP cookies, and session handling outside the core domain.
 */

import type {
  RegisterDemoSandboxDeps,
  RegisterDemoSandboxInput,
  RegisterDemoSandboxResult,
} from "@compoz/core/domain/demo/use-cases/register-demo-sandbox.types";
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

export function registerDemoSandbox({
  demoSandboxes,
  nowIso = () => new Date().toISOString(),
}: RegisterDemoSandboxDeps) {
  return async function run(
    input: RegisterDemoSandboxInput,
  ): Promise<RegisterDemoSandboxResult> {
    const demoInstanceId = assertNonEmptyTrimmed(input.demoInstanceId, [
      "demoInstanceId",
    ]);
    const userId = assertNonEmptyTrimmed(input.userId, ["userId"]);
    const websiteId = assertNonEmptyTrimmed(input.websiteId, ["websiteId"]);
    const expiresAt = assertIsoDateString(input.expiresAt, ["expiresAt"]);

    await demoSandboxes.ensureBase();

    const sandbox = {
      demoInstanceId,
      userId,
      websiteId,
      expiresAt,
      createdAt: nowIso(),
    } as const;

    await demoSandboxes.put(sandbox);

    return { sandbox };
  };
}
