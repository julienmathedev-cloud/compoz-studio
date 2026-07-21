/**
 * @file packages/core/src/domain/site/use-cases/status/helpers.ts
 * @layer core/domain/site/use-cases/status
 * @description Pure helpers for computing site status diffs.
 * @remarks
 * No I/O belongs here; deep comparisons intentionally use `safeStringify`
 * in V0.5.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";

import {
  pageDiffKind,
  safeStringify,
} from "@compoz/core/domain/site/use-cases/status/site-diff";

export function pageIndexEntryDiffers(args: {
  draftRef: Readonly<PageSummary>;
  publishedRef: Readonly<PageSummary>;
}): boolean {
  const { draftRef, publishedRef } = args;

  return (
    draftRef.slug !== publishedRef.slug ||
    draftRef.name !== publishedRef.name ||
    draftRef.parentId !== publishedRef.parentId
  );
}

type ChildIdsByParent = Map<string | null, ReadonlyArray<string>>;

function groupChildIdsByParent(
  refs: ReadonlyArray<PageSummary>,
): ChildIdsByParent {
  const groups = new Map<string | null, string[]>();

  for (const ref of refs) {
    const parentId = ref.parentId ?? null;
    const childIds = groups.get(parentId);

    if (childIds) {
      childIds.push(ref.id);
    } else {
      groups.set(parentId, [ref.id]);
    }
  }

  return groups;
}

function containSameIds(
  first: ReadonlyArray<string>,
  second: ReadonlyArray<string>,
): boolean {
  if (first.length !== second.length) {
    return false;
  }

  const secondIds = new Set(second);

  return first.every((id) => secondIds.has(id));
}

/**
 * Detects pure sibling-order changes and returns the owning parent page IDs.
 *
 * Membership changes are excluded here because new, deleted, or reparented
 * pages are already represented by their own page diffs.
 */
export function findParentIdsWithChangedChildOrder(args: {
  draftIndexRefs: ReadonlyArray<PageSummary>;
  publishedIndexRefs: ReadonlyArray<PageSummary>;
}): ReadonlySet<string> {
  const draftByParent = groupChildIdsByParent(args.draftIndexRefs);
  const publishedByParent = groupChildIdsByParent(args.publishedIndexRefs);

  const parentIds = new Set<string | null>([
    ...draftByParent.keys(),
    ...publishedByParent.keys(),
  ]);

  const changedParentIds = new Set<string>();

  for (const parentId of parentIds) {
    // Root-page ordering has no owning parent page to mark.
    if (!parentId) continue;

    const draftChildIds = draftByParent.get(parentId) ?? [];
    const publishedChildIds = publishedByParent.get(parentId) ?? [];

    // Additions, deletions and reparenting are not pure reorder operations.
    if (!containSameIds(draftChildIds, publishedChildIds)) {
      continue;
    }

    if (safeStringify(draftChildIds) !== safeStringify(publishedChildIds)) {
      changedParentIds.add(parentId);
    }
  }

  return changedParentIds;
}

export function computeSettingsDiff(
  draftSettings: Readonly<SiteSettings>,
  publishedSettings: Readonly<SiteSettings>,
) {
  const isDeepChanged = (a: unknown, b: unknown) =>
    safeStringify(a) !== safeStringify(b);

  const settingsHasChanges = isDeepChanged(draftSettings, publishedSettings);

  const changedSettings = {
    identity: isDeepChanged(draftSettings.identity, publishedSettings.identity),
    primaryMenu: isDeepChanged(
      draftSettings.primaryMenu,
      publishedSettings.primaryMenu,
    ),
    legalMenu: isDeepChanged(
      draftSettings.legalMenu,
      publishedSettings.legalMenu,
    ),
    social: isDeepChanged(draftSettings.social, publishedSettings.social),
    header: isDeepChanged(draftSettings.header, publishedSettings.header),
    footer: isDeepChanged(draftSettings.footer, publishedSettings.footer),
    seo: isDeepChanged(draftSettings.seo, publishedSettings.seo),
    theme: isDeepChanged(draftSettings.theme, publishedSettings.theme),
  } as const;

  return {
    settingsHasChanges,
    changedSettings,
  } as const;
}

export function computePagesAndBlocksDiff(args: {
  draftIndexRefs: ReadonlyArray<PageSummary>;
  publishedIndexRefs: ReadonlyArray<PageSummary>;
  draftPagesById: ReadonlyMap<string, Page>;
  publishedPagesById: ReadonlyMap<string, Page>;
}) {
  const {
    draftIndexRefs,
    publishedIndexRefs,
    draftPagesById,
    publishedPagesById,
  } = args;

  const draftRefById = new Map(draftIndexRefs.map((ref) => [ref.id, ref]));

  const publishedRefById = new Map(
    publishedIndexRefs.map((ref) => [ref.id, ref]),
  );

  const parentIdsWithChangedChildOrder = findParentIdsWithChangedChildOrder({
    draftIndexRefs,
    publishedIndexRefs,
  });

  // Counters: pages
  let pagesNew = 0;
  let pagesModified = 0;
  let pagesDeleted = 0;

  // Counters: blocks
  let blocksDraft = 0;
  let blocksPublished = 0;

  let blocksNew = 0;
  let blocksModified = 0;
  let blocksDeleted = 0;

  // Count published blocks from the published source-of-truth index.
  for (const ref of publishedIndexRefs) {
    const publishedPage = publishedPagesById.get(ref.id);

    const publishedBlocks = Array.isArray(publishedPage?.blocks)
      ? publishedPage.blocks
      : [];

    blocksPublished += publishedBlocks.length;
  }

  // Pages present in published but missing from draft are deleted.
  for (const publishedRef of publishedIndexRefs) {
    if (draftRefById.has(publishedRef.id)) {
      continue;
    }

    pagesDeleted++;

    const publishedPage = publishedPagesById.get(publishedRef.id);

    const publishedBlocks = Array.isArray(publishedPage?.blocks)
      ? publishedPage.blocks
      : [];

    // Blocks removed through page deletion are considered deleted too.
    blocksDeleted += publishedBlocks.length;
  }

  // Draft indexed pages are the admin source of truth.
  for (const draftRef of draftIndexRefs) {
    const publishedRef = publishedRefById.get(draftRef.id);
    const draftPage = draftPagesById.get(draftRef.id);

    if (!draftPage) continue;

    const draftBlocks = Array.isArray(draftPage.blocks)
      ? (draftPage.blocks as ReadonlyArray<Block>)
      : [];

    blocksDraft += draftBlocks.length;

    // A never-published page makes all its draft blocks new.
    if (!publishedRef) {
      pagesNew++;
      blocksNew += draftBlocks.length;

      continue;
    }

    const publishedPage = publishedPagesById.get(draftRef.id);

    const pageStateDiffers =
      !publishedPage || pageDiffKind(draftPage, publishedPage) === "modified";

    const indexEntryDiffers = pageIndexEntryDiffers({
      draftRef,
      publishedRef,
    });

    const childOrderDiffers = parentIdsWithChangedChildOrder.has(draftRef.id);

    const isPageModified =
      pageStateDiffers || indexEntryDiffers || childOrderDiffers;

    if (isPageModified) {
      pagesModified++;
    }

    const publishedBlocks = Array.isArray(publishedPage?.blocks)
      ? (publishedPage.blocks as ReadonlyArray<Block>)
      : [];

    const publishedBlocksById = new Map<string, Block>();

    for (const block of publishedBlocks) {
      if (block && typeof block === "object" && typeof block.id === "string") {
        publishedBlocksById.set(block.id, block);
      }
    }

    // Draft blocks determine new and modified block counters.
    const draftBlockIds = new Set<string>();

    for (const block of draftBlocks) {
      const id = typeof block?.id === "string" ? block.id : "";

      if (!id) continue;

      draftBlockIds.add(id);

      const publishedBlock = publishedBlocksById.get(id);

      if (!publishedBlock) {
        blocksNew++;

        continue;
      }

      if (safeStringify(block) !== safeStringify(publishedBlock)) {
        blocksModified++;
      }
    }

    // Published blocks missing from draft are deleted.
    for (const publishedBlock of publishedBlocks) {
      const id =
        typeof publishedBlock?.id === "string" ? publishedBlock.id : "";

      if (!id) continue;

      if (!draftBlockIds.has(id)) {
        blocksDeleted++;
      }
    }
  }

  const pagesDraft = draftIndexRefs.length;
  const pagesPublished = publishedIndexRefs.length;

  const pagesHasChanges = pagesNew + pagesModified + pagesDeleted > 0;

  const blocksHasChanges = blocksNew + blocksModified + blocksDeleted > 0;

  return {
    pages: {
      draft: pagesDraft,
      published: pagesPublished,
      modified: pagesModified,
      new: pagesNew,
      deleted: pagesDeleted,
      hasChanges: pagesHasChanges,
    },
    blocks: {
      draft: blocksDraft,
      published: blocksPublished,
      modified: blocksModified,
      new: blocksNew,
      deleted: blocksDeleted,
      hasChanges: blocksHasChanges,
    },
  } as const;
}
