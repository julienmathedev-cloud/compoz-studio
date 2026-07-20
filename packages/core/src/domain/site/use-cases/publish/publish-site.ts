/**
 * @file packages/core/src/domain/site/use-cases/publish/publish-site.ts
 * @layer core/domain/site/use-cases/publish
 * @description Publishes a site from one content state to another.
 * @remarks
 * Blocking invariants are checked before writing settings, and the published index is derived only from pages that were actually copied.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";
import {
  copyPages,
  copySettingsBestEffort,
  deleteOrphanPages,
} from "@compoz/core/domain/site/use-cases/publish/helpers";
import type {
  PublishSiteDeps,
  PublishSiteInput,
  PublishSiteResult,
} from "@compoz/core/domain/site/use-cases/publish/publish-site.types";
import {
  assertPublishInvariantsOrThrowValidationError,
  publishPageWarnings,
  publishWarnings,
  type PublishWarning,
} from "@compoz/core/domain/site/validators/publish";

export function publishSite({
  site,
  pages,
  runtime,
  revalidator,
}: PublishSiteDeps) {
  return async function run(
    input?: PublishSiteInput,
  ): Promise<PublishSiteResult> {
    const from: ContentState = input?.from ?? CONTENT_STATE.DRAFT;
    const to: ContentState = input?.to ?? CONTENT_STATE.PUBLISHED;
    const cleanOrphans = input?.cleanOrphans ?? true;

    const warnings: PublishWarning[] = [];

    if (from === to) {
      throw new DomainError({ code: EC.PUBLISH_IDENTICAL_STATES });
    }

    await Promise.all([site.ensureBase(), pages.ensureBase()]);

    const [sourceIndex, sourceSettings, previousTargetIndex] = await Promise.all([
      site.readIndex(from),
      site.readSettings(from),
      site.readIndex(to),
    ]);

    warnings.push(...publishWarnings(sourceIndex, sourceSettings));

    const sourcePagesArr = await pages.readManyById(
      from,
      sourceIndex.pages.map((ref) => ref.id),
    );

    const sourcePagesById = new Map<string, Page>();
    for (const page of sourcePagesArr) {
      if (page) sourcePagesById.set(page.id, page);
    }

    warnings.push(...publishPageWarnings(sourceIndex, sourcePagesById));

    // Runtime is injected so the domain layer never reads process.env.
    const { isProd } = runtime;

    assertPublishInvariantsOrThrowValidationError({
      identity: sourceSettings.identity,
      seo: sourceSettings.seo,
      isProd,
    });

    const pagesCopy = await copyPages(pages, sourceIndex.pages, from, to);
    warnings.push(...pagesCopy.warnings);

    if (cleanOrphans) {
      // Cleanup is aligned with the target source-of-truth index.
      const cleanup = await deleteOrphanPages({
        pages,
        fromRefs: pagesCopy.copiedRefs,
        to,
        existingRefs: previousTargetIndex.pages,
      });

      warnings.push(...cleanup.warnings);
    }

    const settingsCopy = await copySettingsBestEffort(site, sourceSettings, to);
    warnings.push(...settingsCopy.warnings);

    const stampedIndex: SiteIndex = {
      pages: pagesCopy.copiedRefs,
      updatedAt: new Date().toISOString(),
    };
    await site.putIndex(to, stampedIndex);

    if (to === CONTENT_STATE.PUBLISHED && revalidator) {
      try {
        const slugs = Array.from(
          new Set(
            [...previousTargetIndex.pages, ...pagesCopy.copiedRefs]
              .map((r) => String(r.slug ?? "").trim())
              .filter(Boolean),
          ),
        );

        await revalidator.revalidatePublished({ slugs });
      } catch {
        warnings.push({
          code: EC.PUBLISH_SETTINGS_COPY_FAILED,
          path: ["public", "revalidate"],
          meta: { to },
        });
      }
    }

    return {
      pagesCopied: pagesCopy.pagesCopied,
      settingsCopied: settingsCopy.settingsCopied,
      warnings,
      from,
      to,
    };
  };
}
