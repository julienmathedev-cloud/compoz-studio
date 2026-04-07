/**
 * @file packages/infra/src/demo/kv-demo-seed-reader.ts
 * @layer infra/demo
 * @description
 * Implémentation KV du lecteur de seed démo.
 *
 * @remarks
 * - Vérifie qu'un tenant seed est exploitable pour créer une sandbox démo.
 * - En V1, un seed est considéré valide si son index draft contient
 *   au moins une page exploitable.
 * - Ne lit volontairement pas un snapshot complet du contenu :
 *   le clonage réel est délégué au sandbox cloner.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { DemoSandboxSeedReader } from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";

import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";

function normalizeTenantId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function hasUsableSeedPages(
  pages: ReadonlyArray<{ id: string | null | undefined }> | undefined,
): boolean {
  if (!Array.isArray(pages) || pages.length === 0) {
    return false;
  }

  return pages.some((page) => {
    const pageId = String(page?.id ?? "").trim();
    return pageId.length > 0;
  });
}

export class KvDemoSeedReader implements DemoSandboxSeedReader {
  async readSeedSnapshot(seedTenantId: string): Promise<{ tenantId: string }> {
    const tenantId = normalizeTenantId(seedTenantId);

    if (!tenantId) {
      throw new Error(
        "KvDemoSeedReader.readSeedSnapshot: seedTenantId is required.",
      );
    }

    const site = new KvSiteRepository({ tenantId });
    const index = await site.readIndex(CONTENT_STATE.DRAFT);

    if (!hasUsableSeedPages(index.pages)) {
      throw new Error(
        "KvDemoSeedReader.readSeedSnapshot: demo seed is empty or invalid.",
      );
    }

    return { tenantId };
  }
}
