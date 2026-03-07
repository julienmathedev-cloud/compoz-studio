/**
 * @file packages/core/src/domain/site/use-cases/publish/helpers.ts
 * @layer core/domain
 * @description
 * Helpers pour l’utilisation de `publishSite`.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { PublishSiteDeps } from "@compoz/core/domain/site/use-cases/publish/publish-site.types";
import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";

/**
 * Supprime les pages orphelines dans l’espace cible `to`, **en se basant uniquement
 * sur l’index SoT** (pas de scan / list).
 *
 * @remarks
 * - `fromRefs` = refs effectivement copiées (SoT publish).
 * - `existingRefs` = refs existantes côté `to` **issues de l’index** (SoT target)
 */
export async function deleteOrphanPages(args: {
  pages: PublishSiteDeps["pages"];
  fromRefs: ReadonlyArray<PageSummary>;
  to: ContentState;

  /** ✅ Obligatoire : refs existantes côté `to`, issues de `site.readIndex(to)` */
  existingRefs: ReadonlyArray<PageSummary>;
}) {
  const { pages, fromRefs, to, existingRefs } = args;

  const warnings: PublishWarning[] = [];

  const expectedIds = new Set(fromRefs.map((r) => r.id));
  const existingIds = new Set(existingRefs.map((r) => r.id));

  let deleted = 0;

  // On ne supprime que ce qui est "connu" dans l’index cible (SoT).
  for (const id of existingIds) {
    if (!expectedIds.has(id)) {
      const ref = existingRefs.find((r) => r.id === id);

      try {
        await pages.deleteById(to, id);
        deleted++;
      } catch {
        warnings.push({
          code: EC.PUBLISH_PAGE_DELETE_FAILED,
          path: ["pages", ref?.slug || id],
          meta: { pageId: id, to },
        });
      }
    }
  }

  return { deleted, warnings };
}

export async function copySettingsBestEffort(
  site: PublishSiteDeps["site"],
  sourceSettings: SiteSettings,
  to: ContentState,
) {
  const warnings: PublishWarning[] = [];
  let settingsCopied = false;

  try {
    await site.putSettings(to, sourceSettings);
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

/**
 * Copie les pages (batch read), en collectant les warnings pour pages manquantes.
 *
 * @remarks
 * - Optimisation KV : 1 MGET (readManyById) au lieu de N GET (readById)
 * - Optimisation KV : 1 MSET (putMany) au lieu de N SET (put)
 */
export async function copyPages(
  pages: PublishSiteDeps["pages"],
  refs: ReadonlyArray<PageSummary>,
  from: ContentState,
  to: ContentState,
) {
  const warnings: PublishWarning[] = [];
  const copiedRefs: PageSummary[] = [];

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

  await pages.putMany(to, toWrite);

  return { pagesCopied, copiedRefs, warnings };
}
