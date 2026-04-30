/**
 * @file packages/infra/src/demo/kv-demo-sandbox-cloner.ts
 * @layer infra/demo
 * @description
 * Implémentation KV du clonage d'une sandbox démo à partir d'un tenant seed.
 *
 * @remarks
 * - V1 volontairement limitée au contenu draft uniquement.
 * - Copie :
 *   - site settings (draft)
 *   - site index (draft)
 *   - pages référencées par l'index (draft)
 * - Ne copie pas l'état published.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  DemoSandboxCloneResult,
  DemoSandboxCloner,
} from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";
import type { Page } from "@compoz/core/domain/pages/entities/page";

import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";

function normalizeTenantId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getPageIdsFromIndex(
  pages: ReadonlyArray<{ id: string | null | undefined }> | undefined,
): string[] {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];

  for (const page of pages) {
    const pageId = String(page?.id ?? "").trim();
    if (!pageId || seen.has(pageId)) {
      continue;
    }

    seen.add(pageId);
    out.push(pageId);
  }

  return out;
}

function assertAllPagesResolved(
  pageIds: ReadonlyArray<string>,
  pages: ReadonlyArray<Page | null>,
): Page[] {
  const out: Page[] = [];

  for (let i = 0; i < pageIds.length; i += 1) {
    const page = pages[i];
    if (!page) {
      throw new Error(
        `KvDemoSandboxCloner.cloneSeedToTenant: missing seed page "${pageIds[i]}".`,
      );
    }

    out.push(page);
  }

  return out;
}

export class KvDemoSandboxCloner implements DemoSandboxCloner {
  async cloneSeedToTenant(args: {
    sourceTenantId: string;
    targetTenantId: string;
  }): Promise<DemoSandboxCloneResult> {
    const sourceTenantId = normalizeTenantId(args.sourceTenantId);
    const targetTenantId = normalizeTenantId(args.targetTenantId);

    if (!sourceTenantId) {
      throw new Error(
        "KvDemoSandboxCloner.cloneSeedToTenant: sourceTenantId is required.",
      );
    }

    if (!targetTenantId) {
      throw new Error(
        "KvDemoSandboxCloner.cloneSeedToTenant: targetTenantId is required.",
      );
    }

    const sourceSite = new KvSiteRepository({ tenantId: sourceTenantId });
    const targetSite = new KvSiteRepository({ tenantId: targetTenantId });

    const sourcePages = new KvPagesRepository({ tenantId: sourceTenantId });
    const targetPages = new KvPagesRepository({ tenantId: targetTenantId });

    const [settings, index] = await Promise.all([
      sourceSite.readSettings(CONTENT_STATE.PUBLISHED),
      sourceSite.readIndex(CONTENT_STATE.PUBLISHED),
    ]);

    const pageIds = getPageIdsFromIndex(index.pages);

    const rawPages =
      pageIds.length > 0
        ? await sourcePages.readManyById(CONTENT_STATE.PUBLISHED, pageIds)
        : [];

    const pages = assertAllPagesResolved(pageIds, rawPages);

    await targetSite.ensureBase();
    await targetPages.ensureBase();

    await targetSite.putSettings(CONTENT_STATE.DRAFT, settings);

    if (pages.length > 0) {
      await targetPages.putMany(CONTENT_STATE.DRAFT, pages);
    }

    await targetSite.putIndex(CONTENT_STATE.DRAFT, index);

    return {
      tenantId: targetTenantId,
    };
  }
}
