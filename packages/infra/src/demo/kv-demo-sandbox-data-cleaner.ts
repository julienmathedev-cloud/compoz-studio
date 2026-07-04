/**
 * @file packages/infra/src/demo/kv-demo-sandbox-data-cleaner.ts
 * @layer infra/demo
 *
 * @description
 * Implémentation KV du nettoyage des données d’un Website sandbox démo.
 *
 * @remarks
 * - Supprime toutes les clés préfixées par `compoz:<websiteId>:*`.
 * - Utilisé par le cleanup des sandboxes démo expirées.
 * - V1 : suppression globale simple via pattern.
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

    // Guard défensif V1 : on ne supprime que les sandboxes démo générées.
    if (!normalizedWebsiteId.startsWith("demo-")) {
      throw new Error(
        "KvDemoSandboxDataCleaner.deleteSandboxData: only demo websites can be deleted.",
      );
    }

    return deleteKeysByPattern(websiteKeyPattern(normalizedWebsiteId));
  }
}
