/**
 * @file packages/core/src/domain/site/use-cases/publish/publish-site.ts
 * @layer core/domain/site/use-cases/publish
 * @description Atomically publishes the Draft site snapshot to Published.
 * @remarks
 * Blocking invariants and content warnings are computed from the same coherent
 * Draft read; public revalidation remains a post-commit best-effort effect.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";
import { preparePagesForPublication } from "@compoz/core/domain/site/use-cases/publish/helpers";
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
  transaction,
  runtime,
  revalidator,
}: PublishSiteDeps) {
  return async function run(
    input?: PublishSiteInput,
  ): Promise<PublishSiteResult> {
    const from: ContentState = input?.from ?? CONTENT_STATE.DRAFT;
    const to: ContentState = input?.to ?? CONTENT_STATE.PUBLISHED;

    if (from === to) {
      throw new DomainError({ code: EC.PUBLISH_IDENTICAL_STATES });
    }

    if (from !== CONTENT_STATE.DRAFT || to !== CONTENT_STATE.PUBLISHED) {
      throw new DomainError({ code: EC.PUBLISH_DIRECTION_UNSUPPORTED });
    }

    if (input?.cleanOrphans === false) {
      throw new DomainError({ code: EC.PUBLISH_EXACT_SNAPSHOT_REQUIRED });
    }

    const committed = await transaction.run(async (context) => {
      const { site, pages } = context;

      const [sourceIndex, sourceSettings, previousTargetIndex] =
        await Promise.all([
          site.readIndex(CONTENT_STATE.DRAFT),
          site.readSettings(CONTENT_STATE.DRAFT),
          site.readIndex(CONTENT_STATE.PUBLISHED),
        ]);

      const sourcePagesArr = await pages.readManyById(
        CONTENT_STATE.DRAFT,
        sourceIndex.pages.map((ref) => ref.id),
      );

      const prepared = preparePagesForPublication(
        sourceIndex.pages,
        sourcePagesArr,
      );

      const warnings: PublishWarning[] = [
        ...publishWarnings(sourceIndex, sourceSettings),
        ...prepared.warnings,
      ];

      const sourcePagesById = new Map<string, Page>();

      for (const page of prepared.pages) {
        sourcePagesById.set(page.id, page);
      }

      const publishableIndex: SiteIndex = {
        ...sourceIndex,
        pages: prepared.copiedRefs,
      };

      warnings.push(...publishPageWarnings(publishableIndex, sourcePagesById));

      // Runtime is injected so the domain layer never reads process.env.
      assertPublishInvariantsOrThrowValidationError({
        identity: sourceSettings.identity,
        seo: sourceSettings.seo,
        isProd: runtime.isProd,
      });

      await context.replacePublishedSnapshot({
        pages: prepared.pages,
        settings: sourceSettings,
        publishedAt: new Date().toISOString(),
      });

      const slugs = Array.from(
        new Set(
          [...previousTargetIndex.pages, ...prepared.copiedRefs]
            .map((ref) => String(ref.slug ?? "").trim())
            .filter(Boolean),
        ),
      );

      return {
        pagesCopied: prepared.pages.length,
        settingsCopied: true,
        warnings,
        slugs,
      };
    });

    const warnings: PublishWarning[] = [...committed.warnings];

    if (revalidator) {
      try {
        await revalidator.revalidatePublished({
          slugs: committed.slugs,
        });
      } catch {
        warnings.push({
          code: EC.PUBLISH_REVALIDATION_FAILED,
          path: ["public", "revalidate"],
          meta: { to },
        });
      }
    }

    return {
      pagesCopied: committed.pagesCopied,
      settingsCopied: committed.settingsCopied,
      warnings,
      from,
      to,
    };
  };
}
