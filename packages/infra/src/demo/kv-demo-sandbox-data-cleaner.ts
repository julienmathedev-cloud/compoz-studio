/**
 * @file packages/infra/src/demo/kv-demo-sandbox-data-cleaner.ts
 * @layer infra/demo
 * @description KV implementation for deleting expired demo sandbox data.
 * @remarks
 * Cleanup is limited to `compoz:<websiteId>:*` keys and guarded to demo-generated website ids.
 */

import type { DemoSandboxDataCleaner } from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes.types";
import { deleteKeysByPattern } from "@compoz/infra/kv/kv-delete-by-pattern";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";

function websiteKeyPattern(websiteId: string): string {
  return `compoz:${websiteId}:*`;
}

export class KvDemoSandboxDataCleaner implements DemoSandboxDataCleaner {
  async deleteSandboxData(websiteId: string): Promise<{
    keysMatched: number;
    keysDeleted: number;
  }> {
    const normalizedWebsiteId = requireWebsiteId(
      websiteId,
      "KvDemoSandboxDataCleaner.deleteSandboxData",
    ).toLowerCase();

    // Defensive guard: only generated demo sandboxes may be deleted.
    if (!normalizedWebsiteId.startsWith("demo-")) {
      throw new Error(
        "KvDemoSandboxDataCleaner.deleteSandboxData: only demo websites can be deleted.",
      );
    }

    return deleteKeysByPattern(websiteKeyPattern(normalizedWebsiteId));
  }
}
