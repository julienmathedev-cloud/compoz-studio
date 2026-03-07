/**
 * @file packages/core/src/domain/site/use-cases/publish-site.ts
 * @layer core/domain
 * @description
 * Use-case : publier le site d’un état vers un autre (ex. draft → published).
 * Copie l’index, les pages et les settings de `from` vers `to`.
 *
 * @remarks
 * - Invariants bloquants avant écriture des settings : Identity + SEO.
 * - Warnings non bloquants : index vide, pages manquantes, menus vides, logo absent, etc.
 * - Garantie V0.5 : l’index publié est dérivé des pages réellement copiées
 *   (évite un published incohérent en cas d’échec partiel).
 * - Orphans (cleanOrphans) : suppression basée sur l’index cible (SoT)`
 *   pour minimiser les READ KV.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
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

    const [sourceIndex, sourceSettings] = await Promise.all([
      site.readIndex(from),
      site.readSettings(from),
    ]);

    warnings.push(...publishWarnings(sourceIndex, sourceSettings));

    // ✅ runtime injecté (pas de process.env dans le domaine)
    const { isProd } = runtime;

    assertPublishInvariantsOrThrowValidationError({
      identity: sourceSettings.identity,
      seo: sourceSettings.seo,
      isProd,
    });

    const pagesCopy = await copyPages(pages, sourceIndex.pages, from, to);
    warnings.push(...pagesCopy.warnings);

    if (cleanOrphans) {
      // ✅ Aligné avec index SoT`
      const targetIndex = await site.readIndex(to);

      const cleanup = await deleteOrphanPages({
        pages,
        fromRefs: pagesCopy.copiedRefs,
        to,
        existingRefs: targetIndex.pages,
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
        const slugs = pagesCopy.copiedRefs
          .map((r) => String(r.slug ?? "").trim())
          .filter(Boolean);

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
