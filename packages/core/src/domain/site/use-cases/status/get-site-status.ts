/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status.ts
 * @layer core/domain
 *
 * @description
 * Use-case (read) : calcule l’état global du site (draft vs published).
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";

import type {
  GetSiteStatusDeps,
  GetSiteStatusResult,
} from "@compoz/core/domain/site/use-cases/status/get-site-status.types";

import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";
import { publishWarnings } from "@compoz/core/domain/site/validators/publish";
import { assertSiteStatusDTO } from "@compoz/core/domain/site/validators/status";

import {
  asNonEmptyString,
  safeStringify,
} from "@compoz/core/domain/site/use-cases/status/site-diff";

export function getSiteStatus({ pages, site, cache }: GetSiteStatusDeps) {
  return async function run(): Promise<GetSiteStatusResult> {
    // ---------------------------------------------------------------------
    // 1) Snapshot (1 read) — read-through cache
    // ---------------------------------------------------------------------
    const cached = await cache.readStatusSnapshot();
    if (cached) return { status: cached };

    // ---------------------------------------------------------------------
    // 2) Compute (cold path)
    // ---------------------------------------------------------------------
    await Promise.all([pages.ensureBase(), site.ensureBase()]);

    const [
      publishedIndex,
      draftSettings,
      publishedSettings,
      draftSummaries,
      publishedSummaries,
    ] = await Promise.all([
      site.readIndex(CONTENT_STATE.PUBLISHED),
      site.readSettings(CONTENT_STATE.DRAFT),
      site.readSettings(CONTENT_STATE.PUBLISHED),
      pages.list(CONTENT_STATE.DRAFT),
      pages.list(CONTENT_STATE.PUBLISHED),
    ]);

    // ✅ Source de vérité "publié" = index.updatedAt (même avec 0 page publiée)
    const lastPublishedAt = asNonEmptyString(publishedIndex?.updatedAt);

    // ✅ Publié = déjà publié au moins une fois (updatedAt) OU pages publiées présentes
    const publishedExists =
      Boolean(lastPublishedAt) || publishedSummaries.length > 0;

    // Maps pour lookup rapide (summary)
    const publishedById = new Map(publishedSummaries.map((p) => [p.id, p]));
    const draftById = new Map(draftSummaries.map((p) => [p.id, p]));

    // Dirty settings = deep diff simple
    const settingsHasChanges =
      safeStringify(draftSettings) !== safeStringify(publishedSettings);

    const changedSettings = {
      identity:
        safeStringify(draftSettings?.identity) !==
        safeStringify(publishedSettings?.identity),

      primaryMenu:
        safeStringify(draftSettings?.primaryMenu) !==
        safeStringify(publishedSettings?.primaryMenu),

      legalMenu:
        safeStringify(draftSettings?.legalMenu) !==
        safeStringify(publishedSettings?.legalMenu),

      social:
        safeStringify(draftSettings?.social) !==
        safeStringify(publishedSettings?.social),

      header:
        safeStringify(draftSettings?.header) !==
        safeStringify(publishedSettings?.header),

      footer:
        safeStringify(draftSettings?.footer) !==
        safeStringify(publishedSettings?.footer),

      seo:
        safeStringify(draftSettings?.seo) !==
        safeStringify(publishedSettings?.seo),
    } as const;

    // --- Batch reads pages (pour blocks counts + updatedAt) ---
    const draftIds = draftSummaries.map((s) => s.id);
    const publishedIds = publishedSummaries.map((s) => s.id);

    const [draftPagesArr, publishedPagesArr] = await Promise.all([
      pages.readManyById(CONTENT_STATE.DRAFT, draftIds),
      pages.readManyById(CONTENT_STATE.PUBLISHED, publishedIds),
    ]);

    const prePublishWarnings: ReadonlyArray<PublishWarning> = publishWarnings(
      publishedIndex,
      {
        identity: draftSettings.identity,
        seo: draftSettings.seo,
        primaryMenu: draftSettings.primaryMenu,
        legalMenu: draftSettings.legalMenu,
        social: draftSettings.social,
      },
    );

    const draftPagesById = new Map<string, Page>();
    for (const p of draftPagesArr) if (p) draftPagesById.set(p.id, p);

    const publishedPagesById = new Map<string, Page>();
    for (const p of publishedPagesArr) if (p) publishedPagesById.set(p.id, p);

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

    // Compte blocksPublished (toutes pages published)
    for (const p of publishedPagesById.values()) {
      const blocks = Array.isArray(p.blocks) ? p.blocks : [];
      blocksPublished += blocks.length;
    }

    // --- Pages supprimées du draft (présentes en published) => deleted ---
    for (const pub of publishedSummaries) {
      if (!draftById.has(pub.id)) {
        pagesDeleted++;

        const pubPage = publishedPagesById.get(pub.id);
        const pubBlocks = Array.isArray(pubPage?.blocks) ? pubPage.blocks : [];

        // Ces blocks n'existent plus côté draft (via suppression de page) => deleted
        blocksDeleted += pubBlocks.length;
      }
    }

    // Passe sur toutes les pages draft (source de vérité admin)
    for (const d of draftSummaries) {
      const publishedSummary = publishedById.get(d.id);

      const draftPage = draftPagesById.get(d.id);
      if (!draftPage) continue;

      const draftBlocks = Array.isArray(draftPage.blocks)
        ? (draftPage.blocks as ReadonlyArray<Block>)
        : [];

      blocksDraft += draftBlocks.length;

      // Page jamais publiée => new page + tous les blocks "new"
      if (!publishedSummary) {
        pagesNew++;
        blocksNew += draftBlocks.length;
        continue;
      }

      const publishedPage = publishedPagesById.get(d.id);

      // Page modifiée
      const publishedMetaUpdatedAt = String(
        publishedPage?.meta?.updatedAt ?? "",
      );
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

        const a = safeStringify(b);
        const c = safeStringify(pb);
        if (a !== c) blocksModified++;
      }

      // 2) Deleted blocks : présents en published mais absents en draft
      for (const pb of publishedBlocks) {
        const id = typeof pb?.id === "string" ? pb.id : "";
        if (!id) continue;
        if (!draftBlockIds.has(id)) blocksDeleted++;
      }
    }

    // -----------------------
    // Derived counts
    // -----------------------
    const pagesHasChanges = pagesNew + pagesModified + pagesDeleted > 0;
    const blocksHasChanges = blocksNew + blocksModified + blocksDeleted > 0;

    const pagesDraft = draftSummaries.length;
    const pagesPublished = publishedSummaries.length;

    const siteHasChanges =
      settingsHasChanges || pagesHasChanges || blocksHasChanges;

    const status = {
      published: { exists: publishedExists, lastPublishedAt },
      hasChanges: {
        site: siteHasChanges,
        settings: settingsHasChanges,
        pages: pagesHasChanges,
      },
      counts: {
        pages: {
          draft: pagesDraft,
          published: pagesPublished,
          modified: pagesModified,
          new: pagesNew,
          deleted: pagesDeleted,
        },
        blocks: {
          draft: blocksDraft,
          published: blocksPublished,
          modified: blocksModified,
          new: blocksNew,
          deleted: blocksDeleted,
        },
      },
      changedSettings,
      prePublishWarnings,
    } as const;

    assertSiteStatusDTO(status);

    // ---------------------------------------------------------------------
    // 3) Write snapshot (KV)
    // ---------------------------------------------------------------------
    await cache.writeStatusSnapshot(status);

    return { status };
  };
}
