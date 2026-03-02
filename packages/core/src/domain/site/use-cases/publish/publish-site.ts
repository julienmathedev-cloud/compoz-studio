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
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import {
  DomainError,
  isDomainError,
} from "@compoz/core/domain/errors/domain-error";
import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type {
  IdentitySettings,
  SeoSettings,
  SiteIndex,
} from "@compoz/core/domain/site/entities";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  PublishSiteDeps,
  PublishSiteInput,
  PublishSiteResult,
} from "@compoz/core/domain/site/use-cases/publish/publish-site.types";
import { assertIdentitySettings } from "@compoz/core/domain/site/validators/identity";
import {
  publishWarnings,
  type PublishWarning,
} from "@compoz/core/domain/site/validators/publish";
import { assertSeoSettings } from "@compoz/core/domain/site/validators/seo";

/**
 * Fabrique du use-case `publishSite`.
 * Les dépôts `site` et `pages` sont injectés pour faciliter les tests.
 */
export function publishSite({ site, pages, revalidator }: PublishSiteDeps) {
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

    assertIdentityAndSeoOrThrowValidationError({
      identity: sourceSettings.identity,
      seo: sourceSettings.seo,
    });

    const pagesCopy = await copyPages(pages, sourceIndex.pages, from, to);
    warnings.push(...pagesCopy.warnings);

    if (cleanOrphans) {
      const cleanup = await deleteOrphanPages({
        pages,
        fromRefs: pagesCopy.copiedRefs,
        to,
      });
      warnings.push(...cleanup.warnings);
    }

    const settingsCopy = await copySettingsBestEffort(site, sourceSettings, to);
    warnings.push(...settingsCopy.warnings);

    const stampedIndex: SiteIndex = {
      pages: pagesCopy.copiedRefs,
      updatedAt: new Date().toISOString(),
    };
    await site.writeIndex(to, stampedIndex);

    // ✅ ISR revalidation (best-effort) uniquement si on publie vers PUBLISHED
    if (to === CONTENT_STATE.PUBLISHED && revalidator) {
      try {
        const slugs = pagesCopy.copiedRefs
          .map((r) => String(r.slug ?? "").trim())
          .filter(Boolean);

        await revalidator.revalidatePublished({ slugs });
      } catch {
        warnings.push({
          code: EC.PUBLISH_SETTINGS_COPY_FAILED, // ⚠️ idéal: un code dédié REVALIDATE_FAILED
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

async function deleteOrphanPages(args: {
  pages: PublishSiteDeps["pages"];
  fromRefs: ReadonlyArray<PageSummary>;
  to: ContentState;
}) {
  const { pages, fromRefs, to } = args;

  const warnings: PublishWarning[] = [];

  const expectedIds = new Set(fromRefs.map((r) => r.id));
  const existing = await pages.list(to);

  let deleted = 0;

  for (const s of existing) {
    if (!expectedIds.has(s.id)) {
      try {
        await pages.deleteById(to, s.id);
        deleted++;
      } catch {
        warnings.push({
          code: EC.PUBLISH_PAGE_DELETE_FAILED,
          path: ["pages", s.slug || s.id],
          meta: { pageId: s.id, to },
        });
      }
    }
  }

  return { deleted, warnings };
}

async function copySettingsBestEffort(
  site: PublishSiteDeps["site"],
  sourceSettings: SiteSettings,
  to: ContentState,
) {
  const warnings: PublishWarning[] = [];
  let settingsCopied = false;

  try {
    await site.writeSettings(to, sourceSettings);
    settingsCopied = true;
  } catch {
    warnings.push({
      code: EC.PUBLISH_SETTINGS_COPY_FAILED,
      path: ["settings"],
      meta: { to },
    });
  }

  return { settingsCopied, warnings };
}

function assertIdentityAndSeoOrThrowValidationError(s: {
  identity: unknown;
  seo: unknown;
}) {
  try {
    assertIdentitySettings(s.identity as IdentitySettings);
    assertSeoSettings(s.seo as SeoSettings);
  } catch (e) {
    if (isDomainError(e)) {
      throw new DomainError({
        code: EC.VALIDATION_ERROR,
        message: e.message,
        details: {
          issues: [
            {
              code: e.code,
              message: e.message,
              details: e.details,
            },
          ],
        },
        cause: e,
      });
    }
    throw e;
  }
}

/**
 * Copie les pages (batch read), en collectant les warnings pour pages manquantes.
 *
 * @remarks
 * - Optimisation KV : 1 MGET (readManyById) au lieu de N GET (readById)
 * - Optimisation KV : 1 MSET (putMany) au lieu de N SET (put)
 */
async function copyPages(
  pages: PublishSiteDeps["pages"],
  refs: ReadonlyArray<PageSummary>,
  from: ContentState,
  to: ContentState,
) {
  const warnings: PublishWarning[] = [];
  const copiedRefs: PageSummary[] = [];

  // 1) Préparer la liste d’ids valides depuis l’index
  const ids: string[] = [];
  const refsById = new Map<string, PageSummary>();

  for (const ref of refs) {
    const pageId = (ref.id ?? "").trim();
    const slug = (ref.slug ?? "").trim();

    if (!pageId || !slug) {
      warnings.push({
        code: EC.PUBLISH_PAGE_MISSING,
        path: ["pages", slug || "(missing-slug)"],
        meta: { reason: "missing_page_id_or_slug_in_index" },
      });
      continue;
    }

    ids.push(pageId);
    refsById.set(pageId, ref);
  }

  // 2) Batch read
  const pagesArr = await pages.readManyById(from, ids);

  const toWrite: Page[] = [];
  let pagesCopied = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const ref = refsById.get(id)!;
    const slug = (ref.slug ?? "").trim();

    const p = pagesArr[i] ?? null;
    if (!p) {
      warnings.push({
        code: EC.PUBLISH_PAGE_MISSING,
        path: ["pages", slug],
        meta: { pageId: id },
      });
      continue;
    }

    toWrite.push(p);
    pagesCopied++;

    copiedRefs.push({
      id,
      slug,
      title: (p.title ?? "").trim() || slug,
      parentId: (ref.parentId ?? "").trim() || null,
    });
  }

  // 3) Batch write (🔥 le gain)
  await pages.putMany(to, toWrite);

  return { pagesCopied, copiedRefs, warnings };
}
