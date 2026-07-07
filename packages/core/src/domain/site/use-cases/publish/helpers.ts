/**
 * @file packages/core/src/domain/site/use-cases/publish/helpers.ts
 * @layer core/domain/site/use-cases/publish
 * @description Shared helpers for the publish site use-case.
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
 * Deletes target pages that are no longer present in the source index.
 * @remarks
 * Deletion is based only on indexed target refs; no storage scan is performed.
 */
export async function deleteOrphanPages(args: {
  pages: PublishSiteDeps["pages"];
  fromRefs: ReadonlyArray<PageSummary>;
  to: ContentState;
  /** Existing target refs read from `site.readIndex(to)`. */
  existingRefs: ReadonlyArray<PageSummary>;
}) {
  const { pages, fromRefs, to, existingRefs } = args;

  const warnings: PublishWarning[] = [];

  const expectedIds = new Set(fromRefs.map((r) => r.id));
  const existingIds = new Set(existingRefs.map((r) => r.id));

  let deleted = 0;

  // Only delete pages known by the target source-of-truth index.
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
 * Copies indexed pages from one content state to another.
 * @remarks
 * Uses batch reads and writes to avoid one storage call per page.
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
      name: (p.name ?? "").trim() || slug,
      parentId: (ref.parentId ?? "").trim() || null,
    });
  }

  await pages.putMany(to, toWrite);

  return { pagesCopied, copiedRefs, warnings };
}
