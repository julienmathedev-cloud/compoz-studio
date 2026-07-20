/**
 * @file packages/core/src/domain/site/use-cases/publish/helpers.ts
 * @layer core/domain/site/use-cases/publish
 * @description Shared helpers for the publish site use-case.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";

/**
 * Builds the exact ordered page snapshot from one already-loaded Draft read.
 * @remarks
 * The returned pages are the same objects used for warnings and publication.
 */
export function preparePagesForPublication(
  refs: ReadonlyArray<PageSummary>,
  pagesArr: ReadonlyArray<Page | null>,
) {
  const warnings: PublishWarning[] = [];
  const copiedRefs: PageSummary[] = [];
  const pages: Page[] = [];

  for (let index = 0; index < refs.length; index++) {
    const ref = refs[index];
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

    const page = pagesArr[index] ?? null;

    if (!page) {
      warnings.push({
        code: EC.PUBLISH_PAGE_MISSING,
        path: ["pages", slug],
        meta: { pageId },
      });
      continue;
    }

    pages.push(page);

    copiedRefs.push({
      id: pageId,
      slug,
      name: (page.name ?? "").trim() || slug,
      parentId: (ref.parentId ?? "").trim() || null,
    });
  }

  return { pages, copiedRefs, warnings };
}
