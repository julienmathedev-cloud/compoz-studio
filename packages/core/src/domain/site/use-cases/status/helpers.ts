/**
 * @file packages/core/src/domain/site/use-cases/status/helpers.ts
 * @layer core/domain/site/use-cases/status
 * @description
 * Helpers purs pour calculer le status du site (diff settings + diff pages/blocks).
 *
 * @remarks
 * - Pas d'I/O ici : uniquement du calcul à partir des données déjà lues.
 * - Les comparaisons deep utilisent `safeStringify` (V0.5).
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { safeStringify } from "@compoz/core/domain/site/use-cases/status/site-diff";

/* -------------------------------------------------------------------------- */
/* Settings diff                                                              */
/* -------------------------------------------------------------------------- */

export function computeSettingsDiff(
  draftSettings: Readonly<SiteSettings>,
  publishedSettings: Readonly<SiteSettings>,
) {
  const isDeepChanged = (a: unknown, b: unknown) =>
    safeStringify(a) !== safeStringify(b);

  const settingsHasChanges = isDeepChanged(draftSettings, publishedSettings);

  const changedSettings = {
    identity: isDeepChanged(
      draftSettings?.identity,
      publishedSettings?.identity,
    ),
    primaryMenu: isDeepChanged(
      draftSettings?.primaryMenu,
      publishedSettings?.primaryMenu,
    ),
    legalMenu: isDeepChanged(
      draftSettings?.legalMenu,
      publishedSettings?.legalMenu,
    ),
    social: isDeepChanged(draftSettings?.social, publishedSettings?.social),
    header: isDeepChanged(draftSettings?.header, publishedSettings?.header),
    footer: isDeepChanged(draftSettings?.footer, publishedSettings?.footer),
    seo: isDeepChanged(draftSettings?.seo, publishedSettings?.seo),
    theme: isDeepChanged(draftSettings?.theme, publishedSettings?.theme),
  } as const;

  return { settingsHasChanges, changedSettings } as const;
}

/* -------------------------------------------------------------------------- */
/* Pages + Blocks diff                                                        */
/* -------------------------------------------------------------------------- */

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

  const draftRefById = new Map(draftIndexRefs.map((r) => [r.id, r]));
  const publishedRefById = new Map(publishedIndexRefs.map((r) => [r.id, r]));

  // -----------------------
  // Counters: pages
  // -----------------------
  let pagesNew = 0;
  let pagesModified = 0;
  let pagesDeleted = 0;

  // -----------------------
  // Counters: blocks
  // -----------------------
  let blocksDraft = 0;
  let blocksPublished = 0;

  let blocksNew = 0;
  let blocksModified = 0;
  let blocksDeleted = 0;

  // Compte blocksPublished (toutes pages published indexées)
  for (const ref of publishedIndexRefs) {
    const p = publishedPagesById.get(ref.id);
    const blocks = Array.isArray(p?.blocks) ? p.blocks : [];
    blocksPublished += blocks.length;
  }

  // Pages supprimées du draft (présentes en published index)
  for (const pubRef of publishedIndexRefs) {
    if (!draftRefById.has(pubRef.id)) {
      pagesDeleted++;

      const pubPage = publishedPagesById.get(pubRef.id);
      const pubBlocks = Array.isArray(pubPage?.blocks) ? pubPage.blocks : [];

      // Ces blocks n'existent plus côté draft (via suppression de page) => deleted
      blocksDeleted += pubBlocks.length;
    }
  }

  // Passe sur toutes les pages draft indexées (SoT admin)
  for (const dRef of draftIndexRefs) {
    const publishedRef = publishedRefById.get(dRef.id);

    const draftPage = draftPagesById.get(dRef.id);
    if (!draftPage) continue;

    const draftBlocks = Array.isArray(draftPage.blocks)
      ? (draftPage.blocks as ReadonlyArray<Block>)
      : [];

    blocksDraft += draftBlocks.length;

    // Page jamais publiée => new page + tous les blocks "new"
    if (!publishedRef) {
      pagesNew++;
      blocksNew += draftBlocks.length;
      continue;
    }

    const publishedPage = publishedPagesById.get(dRef.id);

    // Page modifiée (meta.updatedAt)
    const publishedMetaUpdatedAt = String(publishedPage?.meta?.updatedAt ?? "");
    const draftMetaUpdatedAt = String(draftPage?.meta?.updatedAt ?? "");
    const isPageModified = draftMetaUpdatedAt !== publishedMetaUpdatedAt;
    if (isPageModified) pagesModified++;

    const publishedBlocks = Array.isArray(publishedPage?.blocks)
      ? (publishedPage.blocks as ReadonlyArray<Block>)
      : [];

    const publishedBlocksById = new Map<string, Block>();
    for (const b of publishedBlocks) {
      if (b && typeof b === "object" && typeof b.id === "string") {
        publishedBlocksById.set(b.id, b);
      }
    }

    // 1) New/Modified blocks côté draft
    const draftBlockIds = new Set<string>();

    for (const b of draftBlocks) {
      const id = typeof b?.id === "string" ? b.id : "";
      if (!id) continue;
      draftBlockIds.add(id);

      const pb = publishedBlocksById.get(id);

      if (!pb) {
        blocksNew++;
        continue;
      }

      if (safeStringify(b) !== safeStringify(pb)) {
        blocksModified++;
      }
    }

    // 2) Deleted blocks : présents en published mais absents en draft
    for (const pb of publishedBlocks) {
      const id = typeof pb?.id === "string" ? pb.id : "";
      if (!id) continue;
      if (!draftBlockIds.has(id)) blocksDeleted++;
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
