/**
 * @file packages/infra/src/demo/kv-demo-sandbox-tenant-cleaner.ts
 * @layer infra/demo
 * @description
 * Implémentation KV du nettoyage des données d'un tenant sandbox démo.
 *
 * @remarks
 * - Supprime toutes les clés préfixées par `compoz:<tenantId>:*`.
 * - Utilisé par le cleanup des sandboxes démo expirées.
 * - V1 : suppression globale simple via pattern.
 */

import type { DemoSandboxTenantCleaner } from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes.types";

import { deleteKeysByPattern } from "@compoz/infra/kv/kv-delete-by-pattern";
import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";

function tenantKeyPattern(tenantId: string): string {
  return `compoz:${tenantId}:*`;
}

export class KvDemoSandboxTenantCleaner implements DemoSandboxTenantCleaner {
  async deleteTenantData(tenantId: string): Promise<{
    keysMatched: number;
    keysDeleted: number;
  }> {
    const normalizedTenantId = normalizeTenantId(tenantId);

    if (!normalizedTenantId) {
      throw new Error(
        "KvDemoSandboxTenantCleaner.deleteTenantData: tenantId is required.",
      );
    }

    // ✅ Guard défensif V1
    if (!normalizedTenantId.startsWith("demo-")) {
      throw new Error(
        "KvDemoSandboxTenantCleaner.deleteTenantData: only demo tenants can be deleted.",
      );
    }

    return deleteKeysByPattern(tenantKeyPattern(normalizedTenantId));
  }
}
