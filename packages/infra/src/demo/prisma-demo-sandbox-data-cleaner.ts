/**
 * @file packages/infra/src/demo/prisma-demo-sandbox-data-cleaner.ts
 * @layer infra/demo
 * @description Prisma implementation for deleting expired demo sandbox data.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import { assertDemoSandboxWebsiteIdentity } from "@compoz/core/domain/demo/assert-demo-sandbox-website-identity";
import type { DemoSandboxDataCleaner } from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes.types";

import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { prisma } from "@compoz/infra/prisma/prisma-client";

export class PrismaDemoSandboxDataCleaner implements DemoSandboxDataCleaner {
  async deleteExpiredSandbox(
    sandbox: DemoSandbox,
    nowIso: string,
  ): Promise<"cleaned" | "skipped"> {
    const normalizedWebsiteId = requireWebsiteId(
      sandbox.websiteId,
      "PrismaDemoSandboxDataCleaner.deleteExpiredSandbox",
    ).toLowerCase();

    assertDemoSandboxWebsiteIdentity({
      demoInstanceId: sandbox.demoInstanceId,
      websiteId: normalizedWebsiteId,
    });

    return prisma.$transaction(async (tx) => {
      const registered = await tx.demoSandbox.findUnique({
        where: { demoInstanceId: sandbox.demoInstanceId },
      });

      // Another cleanup worker may already have removed the sandbox.
      if (!registered) return "skipped";

      const now = new Date(nowIso);

      if (Number.isNaN(now.getTime())) {
        throw new Error(
          "PrismaDemoSandboxDataCleaner.deleteExpiredSandbox: invalid now.",
        );
      }

      if (registered.expiresAt > now) return "skipped";

      if (
        registered.websiteId !== normalizedWebsiteId ||
        registered.userId !== sandbox.userId
      ) {
        throw new Error(
          "PrismaDemoSandboxDataCleaner.deleteExpiredSandbox: demo sandbox identity mismatch.",
        );
      }

      const [website, user] = await Promise.all([
        tx.website.findUnique({
          where: { id: normalizedWebsiteId },
          select: { id: true, type: true, expiresAt: true },
        }),
        tx.user.findUnique({
          where: { id: sandbox.userId },
          select: { id: true, defaultWebsiteId: true, demo: true },
        }),
      ]);

      if (!website || website.type !== "sandbox") {
        throw new Error(
          "PrismaDemoSandboxDataCleaner.deleteExpiredSandbox: website is not a sandbox.",
        );
      }

      if (!website.expiresAt || website.expiresAt > now) return "skipped";

      const demo = user?.demo;
      const hasMatchingDemoMeta =
        typeof demo === "object" &&
        demo !== null &&
        !Array.isArray(demo) &&
        (demo as Record<string, unknown>)["isDemo"] === true &&
        (demo as Record<string, unknown>)["demoInstanceId"] ===
          sandbox.demoInstanceId;

      if (
        !user ||
        user.defaultWebsiteId !== normalizedWebsiteId ||
        !hasMatchingDemoMeta
      ) {
        throw new Error(
          "PrismaDemoSandboxDataCleaner.deleteExpiredSandbox: demo user identity mismatch.",
        );
      }

      const access = await tx.websiteAccess.findUnique({
        where: {
          userId_websiteId: {
            userId: sandbox.userId,
            websiteId: normalizedWebsiteId,
          },
        },
        select: { userId: true },
      });

      if (!access) {
        throw new Error(
          "PrismaDemoSandboxDataCleaner.deleteExpiredSandbox: demo user access is missing.",
        );
      }

      // Physical blob cleanup is intentionally deferred. Seed blobs are shared
      // with the source Website. Sandbox-owned blobs may remain orphaned until
      // a future maintenance job.
      await tx.website.delete({ where: { id: normalizedWebsiteId } });
      await tx.user.delete({ where: { id: sandbox.userId } });
      return "cleaned";
    });
  }

  /**
   * Compensates a failed sandbox registration. This is intentionally scoped to
   * the generated demo ID and matching demo user, never a generic Website delete.
   */
  async rollbackProvisionedSandbox(args: {
    demoInstanceId: string;
    websiteId: string;
    userId: string;
  }): Promise<void> {
    const websiteId = requireWebsiteId(
      args.websiteId,
      "PrismaDemoSandboxDataCleaner.rollbackProvisionedSandbox",
    ).toLowerCase();

    assertDemoSandboxWebsiteIdentity({
      demoInstanceId: args.demoInstanceId,
      websiteId,
    });

    await prisma.$transaction(async (tx) => {
      const [website, user] = await Promise.all([
        tx.website.findUnique({
          where: { id: websiteId },
          select: { type: true },
        }),
        tx.user.findUnique({
          where: { id: args.userId },
          select: { id: true, defaultWebsiteId: true, demo: true },
        }),
      ]);

      const demo = user?.demo;
      const hasMatchingDemoMeta =
        typeof demo === "object" &&
        demo !== null &&
        !Array.isArray(demo) &&
        (demo as Record<string, unknown>)["isDemo"] === true &&
        (demo as Record<string, unknown>)["demoInstanceId"] ===
          args.demoInstanceId;

      if (
        !website ||
        website.type !== "sandbox" ||
        !user ||
        user.defaultWebsiteId !== websiteId ||
        !hasMatchingDemoMeta
      ) {
        throw new Error(
          "PrismaDemoSandboxDataCleaner.rollbackProvisionedSandbox: sandbox identity mismatch.",
        );
      }

      await tx.website.delete({ where: { id: websiteId } });
      await tx.user.delete({ where: { id: args.userId } });
    });
  }
}
