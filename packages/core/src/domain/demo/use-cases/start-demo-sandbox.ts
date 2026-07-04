/**
 * @file packages/core/src/domain/demo/use-cases/start-demo-sandbox.ts
 * @layer core/domain
 *
 * @description
 * Use-case : démarre une sandbox démo en tentant d’abord une réutilisation,
 * puis en créant une nouvelle sandbox si nécessaire.
 *
 * @remarks
 * - Orchestrateur métier/applicatif.
 * - Ne gère ni cookies HTTP, ni session, ni redirection.
 */

import type {
  StartDemoSandboxDeps,
  StartDemoSandboxInput,
  StartDemoSandboxResult,
} from "@compoz/core/domain/demo/use-cases/start-demo-sandbox.types";
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

function addMsToIso(baseIso: string, ttlMs: number): string {
  const base = Date.parse(baseIso);

  if (Number.isNaN(base)) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path: ["nowIso"] },
    });
  }

  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path: ["ttlMs"] },
    });
  }

  return new Date(base + ttlMs).toISOString();
}

export function startDemoSandbox({
  findReusableDemoSandbox,
  createDemoSandboxFromSeed,
  registerDemoSandbox,
  nowIso = () => new Date().toISOString(),
  ttlMs,
}: StartDemoSandboxDeps) {
  return async function run(
    input: StartDemoSandboxInput,
  ): Promise<StartDemoSandboxResult> {
    const seedWebsiteId = assertNonEmptyTrimmed(input.seedWebsiteId, [
      "seedWebsiteId",
    ]);

    const candidateDemoInstanceId = String(input.demoInstanceId ?? "").trim();

    if (candidateDemoInstanceId) {
      try {
        const reused = await findReusableDemoSandbox({
          demoInstanceId: candidateDemoInstanceId,
        });

        return {
          mode: "reused",
          sandbox: reused.sandbox,
          user: reused.user,
          websiteId: reused.websiteId,
          demoInstanceId: reused.sandbox.demoInstanceId,
          expiresAt: reused.sandbox.expiresAt,
        };
      } catch {
        // Sandbox absente / expirée / incohérente :
        // on retombe volontairement sur une création neuve.
      }
    }

    const now = nowIso();
    const expiresAt = addMsToIso(now, ttlMs);

    const created = await createDemoSandboxFromSeed({
      seedWebsiteId,
      expiresAt,
    });

    const registered = await registerDemoSandbox({
      demoInstanceId: created.demoInstanceId,
      userId: created.user.id,
      websiteId: created.websiteId,
      expiresAt,
    });

    return {
      mode: "created",
      sandbox: registered.sandbox,
      user: created.user,
      websiteId: created.websiteId,
      demoInstanceId: created.demoInstanceId,
      expiresAt,
    };
  };
}
