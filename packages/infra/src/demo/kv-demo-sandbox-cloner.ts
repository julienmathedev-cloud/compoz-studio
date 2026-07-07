/**
 * @file packages/infra/src/demo/kv-demo-sandbox-cloner.ts
 * @layer infra/demo
 * @description KV implementation for cloning a published demo seed into a draft sandbox website.
 * @remarks
 * The target published state is intentionally not copied.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  DemoSandboxCloneResult,
  DemoSandboxCloner,
} from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";

function normalizeWebsiteId(value: unknown): string {
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

  for (let index = 0; index < pageIds.length; index += 1) {
    const page = pages[index];

    if (!page) {
      throw new Error(
        `KvDemoSandboxCloner.cloneSeedToWebsite: missing seed page "${pageIds[index]}".`,
      );
    }

    out.push(page);
  }

  return out;
}

export class KvDemoSandboxCloner implements DemoSandboxCloner {
  async cloneSeedToWebsite(args: {
    sourceWebsiteId: string;
    targetWebsiteId: string;
  }): Promise<DemoSandboxCloneResult> {
    const sourceWebsiteId = normalizeWebsiteId(args.sourceWebsiteId);
    const targetWebsiteId = normalizeWebsiteId(args.targetWebsiteId);

    if (!sourceWebsiteId) {
      throw new Error(
        "KvDemoSandboxCloner.cloneSeedToWebsite: sourceWebsiteId is required.",
      );
    }

    if (!targetWebsiteId) {
      throw new Error(
        "KvDemoSandboxCloner.cloneSeedToWebsite: targetWebsiteId is required.",
      );
    }

    const sourceSite = new KvSiteRepository({ websiteId: sourceWebsiteId });
    const targetSite = new KvSiteRepository({ websiteId: targetWebsiteId });

    const sourcePages = new KvPagesRepository({ websiteId: sourceWebsiteId });
    const targetPages = new KvPagesRepository({ websiteId: targetWebsiteId });

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
      websiteId: targetWebsiteId,
    };
  }
}
