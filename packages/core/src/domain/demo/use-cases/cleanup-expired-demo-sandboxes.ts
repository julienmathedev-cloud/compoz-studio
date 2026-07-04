/**
 * @file packages/core/src/domain/demo/use-cases/cleanup-expired-demo-sandboxes.ts
 * @layer core/domain
 *
 * @description
 * Use-case : supprime les sandboxes démo expirées ainsi que leurs données associées.
 *
 * @remarks
 * - Supprime le record `DemoSandbox`.
 * - Supprime le user démo associé.
 * - Nettoie les données associées à la sandbox.
 * - V1 : traitement séquentiel simple, sans sur-ingénierie.
 */

import type {
  CleanupExpiredDemoSandboxesDeps,
  CleanupExpiredDemoSandboxesInput,
  CleanupExpiredDemoSandboxesResult,
} from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes.types";
import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

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

function isExpired(expiresAt: string, nowIso: string): boolean {
  return Date.parse(expiresAt) <= Date.parse(nowIso);
}

export function cleanupExpiredDemoSandboxes({
  demoSandboxes,
  users,
  sandboxDataCleaner,
  nowIso = () => new Date().toISOString(),
}: CleanupExpiredDemoSandboxesDeps) {
  return async function run(
    input: CleanupExpiredDemoSandboxesInput = {},
  ): Promise<CleanupExpiredDemoSandboxesResult> {
    const continueOnError = input.continueOnError ?? true;
    const now = assertIsoDateString(nowIso(), ["nowIso"]);

    await demoSandboxes.ensureBase();
    await users.ensureBase();

    const allSandboxes = await demoSandboxes.list();
    const expiredSandboxes = allSandboxes.filter((sandbox) =>
      isExpired(sandbox.expiresAt, now),
    );

    const items: Array<{
      demoInstanceId: string;
      websiteId: string;
      userId: string;
      status: "cleaned" | "failed";
      keysMatched?: number;
      keysDeleted?: number;
      error?: string;
    }> = [];

    for (const sandbox of expiredSandboxes) {
      try {
        const sandboxDataCleanup = await sandboxDataCleaner.deleteSandboxData(
          sandbox.websiteId,
        );

        await users.deleteById(sandbox.userId);
        await demoSandboxes.deleteByDemoInstanceId(sandbox.demoInstanceId);

        items.push({
          demoInstanceId: sandbox.demoInstanceId,
          websiteId: sandbox.websiteId,
          userId: sandbox.userId,
          status: "cleaned",
          keysMatched: sandboxDataCleanup.keysMatched,
          keysDeleted: sandboxDataCleanup.keysDeleted,
        });
      } catch (error) {
        items.push({
          demoInstanceId: sandbox.demoInstanceId,
          websiteId: sandbox.websiteId,
          userId: sandbox.userId,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });

        if (!continueOnError) {
          throw error;
        }
      }
    }

    const cleaned = items.filter((item) => item.status === "cleaned").length;
    const failed = items.filter((item) => item.status === "failed").length;

    return {
      total: allSandboxes.length,
      expired: expiredSandboxes.length,
      cleaned,
      failed,
      items,
    };
  };
}
