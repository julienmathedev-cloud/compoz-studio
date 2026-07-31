/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status-details.ts
 * @layer core/domain/site/use-cases/status
 * @description Returns lazy-loaded draft versus published page and block status details.
 * @remarks
 * Uses a read-through status details cache and recomputes from persisted Page
 * rows and lightweight SiteIndex projections on cache miss.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { SiteStatusDetailsDTO } from "@compoz/core/domain/site/dto";
import type { SiteStatusPageDetails } from "@compoz/core/domain/site/entities/site-status-details";
import type {
  GetSiteStatusDetailsDeps,
  GetSiteStatusDetailsInput,
  GetSiteStatusDetailsResult,
} from "@compoz/core/domain/site/use-cases/status/get-site-status-details.types";
import {
  findParentIdsWithChangedChildOrder,
  pageIndexEntryDiffers,
} from "@compoz/core/domain/site/use-cases/status/helpers";
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

    // Cold path: recompute from persisted pages and projections.

    const pagesDetails: SiteStatusPageDetails[] = [];

    // Targeted mode: compute a single page.
    if (pageId) {
      const [draftPage, publishedPage, draftIndex, publishedIndex] =
        await Promise.all([
          pages.readById(CONTENT_STATE.DRAFT, pageId),
          pages.readById(CONTENT_STATE.PUBLISHED, pageId),
          site.readIndex(CONTENT_STATE.DRAFT),
          site.readIndex(CONTENT_STATE.PUBLISHED),
        ]);

      if (!draftPage && !publishedPage) {
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

      const parentIdsWithChangedChildOrder = findParentIdsWithChangedChildOrder(
        {
          draftIndexRefs: draftIndex.pages,
          publishedIndexRefs: publishedIndex.pages,
        },
      );

      const draftRef = draftIndex.pages.find((ref) => ref.id === pageId);

      const publishedRef = publishedIndex.pages.find(
        (ref) => ref.id === pageId,
      );

      const contentDiff = pageDiffKind(
        draftPage ?? null,
        publishedPage ?? null,
      );

      const indexEntryChanged =
        draftRef !== undefined &&
        publishedRef !== undefined &&
        pageIndexEntryDiffers({
          draftRef,
          publishedRef,
        });

      const childOrderChanged = parentIdsWithChangedChildOrder.has(pageId);

      const diff =
        contentDiff === "published" && (indexEntryChanged || childOrderChanged)
          ? "modified"
          : contentDiff;

      const draftBlocks = Array.isArray(draftPage?.blocks)
        ? (draftPage.blocks as ReadonlyArray<Block>)
        : [];

      const publishedBlocks = Array.isArray(publishedPage?.blocks)
        ? (publishedPage.blocks as ReadonlyArray<Block>)
        : [];

      const {
        items: blockItems,
        counts: blockCounts,
        hasChanges: blocksHaveChanges,
      } = buildBlockDetails(draftBlocks, publishedBlocks);

      const pageHasChanges = diff !== "published" || blocksHaveChanges;

      if (!(scope === "dirty" && !pageHasChanges)) {
        pagesDetails.push({
          id: pageId,
          slug: String(draftPage?.slug ?? publishedPage?.slug ?? ""),
          name: String(draftPage?.name ?? publishedPage?.name ?? ""),
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

    // Global mode: page IDs come from the union of draft and published
    // Page-row projections.
    const [draftIndex, publishedIndex] = await Promise.all([
      site.readIndex(CONTENT_STATE.DRAFT),
      site.readIndex(CONTENT_STATE.PUBLISHED),
    ]);

    const parentIdsWithChangedChildOrder = findParentIdsWithChangedChildOrder({
      draftIndexRefs: draftIndex.pages,
      publishedIndexRefs: publishedIndex.pages,
    });

    const ids = unionPageIdsFromIndexes(draftIndex.pages, publishedIndex.pages);

    const [draftPagesArr, publishedPagesArr] = await Promise.all([
      pages.readManyById(CONTENT_STATE.DRAFT, ids),
      pages.readManyById(CONTENT_STATE.PUBLISHED, ids),
    ]);

    const draftById = new Map<string, Page>();

    for (const page of draftPagesArr) {
      if (page) {
        draftById.set(page.id, page);
      }
    }

    const publishedById = new Map<string, Page>();

    for (const page of publishedPagesArr) {
      if (page) {
        publishedById.set(page.id, page);
      }
    }

    const draftRefById = new Map<string, PageSummary>(
      draftIndex.pages.map((ref) => [ref.id, ref]),
    );

    const publishedRefById = new Map<string, PageSummary>(
      publishedIndex.pages.map((ref) => [ref.id, ref]),
    );

    for (const id of ids) {
      const draftPage = draftById.get(id) ?? null;
      const publishedPage = publishedById.get(id) ?? null;

      // Ignore refs that exist in an index but no longer resolve to a page
      // on either side.
      if (!draftPage && !publishedPage) {
        continue;
      }

      const contentDiff = pageDiffKind(draftPage, publishedPage);

      const draftRef = draftRefById.get(id);
      const publishedRef = publishedRefById.get(id);

      const indexEntryChanged =
        draftRef !== undefined &&
        publishedRef !== undefined &&
        pageIndexEntryDiffers({
          draftRef,
          publishedRef,
        });

      const childOrderChanged = parentIdsWithChangedChildOrder.has(id);

      const diff =
        contentDiff === "published" && (indexEntryChanged || childOrderChanged)
          ? "modified"
          : contentDiff;

      const draftBlocks = Array.isArray(draftPage?.blocks)
        ? (draftPage.blocks as ReadonlyArray<Block>)
        : [];

      const publishedBlocks = Array.isArray(publishedPage?.blocks)
        ? (publishedPage.blocks as ReadonlyArray<Block>)
        : [];

      const {
        items: blockItems,
        counts: blockCounts,
        hasChanges: blocksHaveChanges,
      } = buildBlockDetails(draftBlocks, publishedBlocks);

      const pageHasChanges = diff !== "published" || blocksHaveChanges;

      if (scope === "dirty" && !pageHasChanges) {
        continue;
      }

      pagesDetails.push({
        id,
        slug: String(draftPage?.slug ?? publishedPage?.slug ?? ""),
        name: String(draftPage?.name ?? publishedPage?.name ?? ""),
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

  for (const ref of draftRefs) {
    const id = String(ref?.id ?? "").trim();

    if (id) {
      ids.add(id);
    }
  }

  for (const ref of publishedRefs) {
    const id = String(ref?.id ?? "").trim();

    if (id) {
      ids.add(id);
    }
  }

  return [...ids];
}
