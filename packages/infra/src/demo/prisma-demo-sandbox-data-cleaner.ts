/**
 * @file packages/infra/src/demo/prisma-demo-sandbox-data-cleaner.ts
 * @layer infra/demo
 * @description Prisma implementation for deleting expired demo sandbox data.
 */

import type { DemoSandboxDataCleaner } from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes.types";

import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { prisma } from "@compoz/infra/prisma/prisma-client";

export class PrismaDemoSandboxDataCleaner implements DemoSandboxDataCleaner {
  async deleteSandboxData(websiteId: string): Promise<void> {
    const normalizedWebsiteId = requireWebsiteId(
      websiteId,
      "PrismaDemoSandboxDataCleaner.deleteSandboxData",
    ).toLowerCase();

    if (!normalizedWebsiteId.startsWith("demo-")) {
      throw new Error(
        "PrismaDemoSandboxDataCleaner.deleteSandboxData: only demo websites can be deleted.",
      );
    }

    const website = await prisma.website.findUnique({
      where: {
        id: normalizedWebsiteId,
      },
      select: {
        type: true,
      },
    });

    if (!website) {
      throw new Error(
        "PrismaDemoSandboxDataCleaner.deleteSandboxData: sandbox website not found.",
      );
    }

    if (website.type !== "sandbox") {
      throw new Error(
        "PrismaDemoSandboxDataCleaner.deleteSandboxData: website is not a sandbox.",
      );
    }

    // Physical media cleanup is intentionally out of scope because cloning does not duplicate seed media.
    await prisma.website.deleteMany({
      where: {
        id: normalizedWebsiteId,
        type: "sandbox",
      },
    });
  }
}
