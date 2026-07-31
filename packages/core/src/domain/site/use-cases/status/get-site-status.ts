/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status.ts
 * @layer core/domain/site/use-cases/status
 * @description Returns the global draft versus published site status.
 * @remarks
 * Uses a read-through status cache and recomputes from persisted Page rows and
 * their lightweight SiteIndex projections on cache miss.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";

import type { Page } from "@compoz/core/domain/pages/entities/page";

import type {
  GetSiteStatusDeps,
  GetSiteStatusResult,
} from "@compoz/core/domain/site/use-cases/status/get-site-status.types";

import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";
import {
  publishPageWarnings,
  publishWarnings,
} from "@compoz/core/domain/site/validators/publish";
import { assertSiteStatus } from "@compoz/core/domain/site/validators/status";

import { asNonEmptyString } from "@compoz/core/domain/site/use-cases/status/site-diff";

import {
  computePagesAndBlocksDiff,
  computeSettingsDiff,
} from "@compoz/core/domain/site/use-cases/status/helpers";

export function getSiteStatus({ pages, site, cache }: GetSiteStatusDeps) {
  return async function run(): Promise<GetSiteStatusResult> {
    // Read-through cache: hot path is a single status snapshot read.
    const cached = await cache.readStatusSnapshot();
    if (cached) return { status: cached };

    // Cold path: recompute from persisted pages, settings, and projections.

    const [draftIndex, publishedIndex, draftSettings, publishedSettings] =
      await Promise.all([
        site.readIndex(CONTENT_STATE.DRAFT),
        site.readIndex(CONTENT_STATE.PUBLISHED),
        site.readSettings(CONTENT_STATE.DRAFT),
        site.readSettings(CONTENT_STATE.PUBLISHED),
      ]);

    // Published status comes from the published index timestamp, even with zero published pages.
    const lastPublishedAt = asNonEmptyString(publishedIndex.updatedAt);

    // A site is considered published when it has a publish timestamp or indexed published pages.
    const publishedExists =
      Boolean(lastPublishedAt) || publishedIndex.pages.length > 0;

    const { settingsHasChanges, changedSettings } = computeSettingsDiff(
      draftSettings,
      publishedSettings,
    );

    // Batch reads keep page and block counters aligned with Page-row projections.
    const draftIds = draftIndex.pages.map((r) => r.id);
    const publishedIds = publishedIndex.pages.map((r) => r.id);

    const [draftPagesArr, publishedPagesArr] = await Promise.all([
      pages.readManyById(CONTENT_STATE.DRAFT, draftIds),
      pages.readManyById(CONTENT_STATE.PUBLISHED, publishedIds),
    ]);

    const draftPagesById = new Map<string, Page>();
    for (const p of draftPagesArr) if (p) draftPagesById.set(p.id, p);

    const publishedPagesById = new Map<string, Page>();
    for (const p of publishedPagesArr) if (p) publishedPagesById.set(p.id, p);

    const prePublishWarnings: ReadonlyArray<PublishWarning> = [
      ...publishWarnings(draftIndex, {
        identity: draftSettings.identity,
        seo: draftSettings.seo,
        primaryMenu: draftSettings.primaryMenu,
        legalMenu: draftSettings.legalMenu,
        social: draftSettings.social,
      }),
      ...publishPageWarnings(draftIndex, draftPagesById),
    ];

    const diff = computePagesAndBlocksDiff({
      draftIndexRefs: draftIndex.pages,
      publishedIndexRefs: publishedIndex.pages,
      draftPagesById,
      publishedPagesById,
    });

    const siteHasChanges =
      settingsHasChanges || diff.pages.hasChanges || diff.blocks.hasChanges;

    const status = {
      published: { exists: publishedExists, lastPublishedAt },
      hasChanges: {
        site: siteHasChanges,
        settings: settingsHasChanges,
        pages: diff.pages.hasChanges,
      },
      counts: {
        pages: {
          draft: diff.pages.draft,
          published: diff.pages.published,
          modified: diff.pages.modified,
          new: diff.pages.new,
          deleted: diff.pages.deleted,
        },
        blocks: {
          draft: diff.blocks.draft,
          published: diff.blocks.published,
          modified: diff.blocks.modified,
          new: diff.blocks.new,
          deleted: diff.blocks.deleted,
        },
      },
      changedSettings,
      prePublishWarnings,
    } as const;

    assertSiteStatus(status);

    await cache.putStatusSnapshot(status);

    return { status };
  };
}
