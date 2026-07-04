/**
 * @file packages/infra/src/demo/kv-demo-seed-reader.ts
 * @layer infra/demo
 *
 * @description
 * Implémentation KV du lecteur de seed démo.
 *
 * @remarks
 * - Vérifie qu’un Website seed est exploitable pour créer une sandbox démo.
 * - En V1, un seed est considéré valide si son index published contient
 *   au moins une page exploitable.
 * - Ne lit volontairement pas un snapshot complet du contenu :
 *   le clonage réel est délégué au sandbox cloner.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { DemoSandboxSeedReader } from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";

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
  async readSeedSnapshot(
    seedWebsiteId: string,
  ): Promise<{ websiteId: string }> {
    const websiteId = requireWebsiteId(
      seedWebsiteId,
      "KvDemoSeedReader.readSeedSnapshot",
    ).toLowerCase();

    const site = new KvSiteRepository({ websiteId });
    const index = await site.readIndex(CONTENT_STATE.PUBLISHED);

    if (!hasUsableSeedPages(index.pages)) {
      throw new Error(
        "KvDemoSeedReader.readSeedSnapshot: demo seed is empty or invalid.",
      );
    }

    return { websiteId };
  }
}
