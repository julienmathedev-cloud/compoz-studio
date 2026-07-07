/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status-details.ts
 * @layer core/domain/site/use-cases/status
 * @description Returns lazy-loaded draft versus published page and block status details.
 * @remarks
 * Uses a read-through status details cache and recomputes from source-of-truth indexes on cache miss.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteStatusDetailsDTO } from "@compoz/core/domain/site/dto";

import type {
  GetSiteStatusDetailsDeps,
  GetSiteStatusDetailsInput,
  GetSiteStatusDetailsResult,
} from "@compoz/core/domain/site/use-cases/status/get-site-status-details.types";

import type { SiteStatusPageDetails } from "@compoz/core/domain/site/entities/site-status-details";

import {
  buildBlockDetails,
  pageDiffKind,
} from "@compoz/core/domain/site/use-cases/status/site-diff";

export function getSiteStatusDetails({
  pages,
  site,
  cache,
}: GetSiteStatusDetailsDeps) {
  return async function run(
    input: GetSiteStatusDetailsInput,
  ): Promise<GetSiteStatusDetailsResult> {
    const scope = input.scope === "all" ? "all" : "dirty";
    const includeBlocks = Boolean(input.includeBlocks);
    const pageId = (input.pageId ?? "").trim() || null;

    // Read-through cache: hot path is a single status details snapshot read.
    const cached = await cache.readStatusDetailsSnapshot({
      scope,
      includeBlocks,
      pageId,
    });

    if (cached) {
      return { details: cached };
    }

    // Cold path: recompute from persisted pages and site indexes.
    await Promise.all([pages.ensureBase(), site.ensureBase()]);

    const pagesDetails: SiteStatusPageDetails[] = [];

    // Targeted mode: compute a single page.
    if (pageId) {
      const [d, p] = await Promise.all([
        pages.readById(CONTENT_STATE.DRAFT, pageId),
        pages.readById(CONTENT_STATE.PUBLISHED, pageId),
      ]);

      if (!d && !p) {
        const empty: SiteStatusDetailsDTO = {
          scope,
          includeBlocks,
          pages: [],
        };

        await cache.putStatusDetailsSnapshot(
          { scope, includeBlocks, pageId },
          empty,
        );

        return { details: empty };
      }

      const diff = pageDiffKind(d ?? null, p ?? null);

      const draftBlocks = Array.isArray(d?.blocks)
        ? (d.blocks as ReadonlyArray<Block>)
        : [];
      const publishedBlocks = Array.isArray(p?.blocks)
        ? (p.blocks as ReadonlyArray<Block>)
        : [];

      const {
        items: blockItems,
        counts: blockCounts,
        hasChanges,
      } = buildBlockDetails(draftBlocks, publishedBlocks);

      const pageHasChanges = diff !== "published" || hasChanges;

      if (!(scope === "dirty" && !pageHasChanges)) {
        pagesDetails.push({
          id: pageId,
          slug: String(d?.slug ?? p?.slug ?? ""),
          name: String(d?.name ?? p?.name ?? ""),
          diff,
          blocks: blockCounts,
          ...(includeBlocks ? { blockItems } : null),
        });
      }

      const details: SiteStatusDetailsDTO = {
        scope,
        includeBlocks,
        pages: pagesDetails,
      };

      await cache.putStatusDetailsSnapshot(
        { scope, includeBlocks, pageId },
        details,
      );

      return { details };
    }

    // Global mode: page ids come from the union of draft and published source-of-truth indexes.
    const [draftIndex, publishedIndex] = await Promise.all([
      site.readIndex(CONTENT_STATE.DRAFT),
      site.readIndex(CONTENT_STATE.PUBLISHED),
    ]);

    const ids = unionPageIdsFromIndexes(draftIndex.pages, publishedIndex.pages);

    const [draftPagesArr, publishedPagesArr] = await Promise.all([
      pages.readManyById(CONTENT_STATE.DRAFT, ids),
      pages.readManyById(CONTENT_STATE.PUBLISHED, ids),
    ]);

    const draftById = new Map<string, Page>();
    for (const p of draftPagesArr) if (p) draftById.set(p.id, p);

    const publishedById = new Map<string, Page>();
    for (const p of publishedPagesArr) if (p) publishedById.set(p.id, p);

    for (const id of ids) {
      const d = draftById.get(id) ?? null;
      const p = publishedById.get(id) ?? null;

      // Ignore refs that exist in an index but no longer resolve to a page on either side.
      if (!d && !p) continue;

      const diff = pageDiffKind(d, p);

      const draftBlocks = Array.isArray(d?.blocks)
        ? (d.blocks as ReadonlyArray<Block>)
        : [];
      const publishedBlocks = Array.isArray(p?.blocks)
        ? (p.blocks as ReadonlyArray<Block>)
        : [];

      const {
        items: blockItems,
        counts: blockCounts,
        hasChanges,
      } = buildBlockDetails(draftBlocks, publishedBlocks);

      const pageHasChanges = diff !== "published" || hasChanges;

      if (scope === "dirty" && !pageHasChanges) continue;

      pagesDetails.push({
        id,
        slug: String(d?.slug ?? p?.slug ?? ""),
        name: String(d?.name ?? p?.name ?? ""),
        diff,
        blocks: blockCounts,
        ...(includeBlocks ? { blockItems } : null),
      });
    }

    // Keep the existing alpha-by-slug ordering for stable admin output.
    pagesDetails.sort((a, b) => a.slug.localeCompare(b.slug));

    const details: SiteStatusDetailsDTO = {
      scope,
      includeBlocks,
      pages: pagesDetails,
    };

    await cache.putStatusDetailsSnapshot(
      { scope, includeBlocks, pageId },
      details,
    );

    return { details };
  };
}

function unionPageIdsFromIndexes(
  draftRefs: ReadonlyArray<{ id: string }>,
  publishedRefs: ReadonlyArray<{ id: string }>,
): string[] {
  const ids = new Set<string>();

  for (const r of draftRefs) {
    const id = String(r?.id ?? "").trim();
    if (id) ids.add(id);
  }
  for (const r of publishedRefs) {
    const id = String(r?.id ?? "").trim();
    if (id) ids.add(id);
  }

  return [...ids];
}
