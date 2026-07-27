/**
 * @file packages/core/src/domain/pages/use-cases/update-page.ts
 * @layer core/domain/pages/use-cases
 * @description Use case that updates a draft page through a controlled patch.
 * @remarks
 * No-op updates are not persisted. Slug changes validate uniqueness, accept UI-style slugs, and can update menu hrefs when the optional `site` dependency is provided.
 */

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import {
  applyNamePatch,
  applyPaginationEnabledPatch,
  applyParentIdPatch,
  applySeoDescriptionPatch,
  applySeoTitlePatch,
  applySitemapPatch,
  applySlugPatch,
} from "@compoz/core/domain/pages/use-cases/helpers/apply-page-patch";
import type {
  ChangedKey,
  UpdatePageDeps,
  UpdatePageInput,
  UpdatePageResult,
} from "@compoz/core/domain/pages/use-cases/update-page.types";
import { replacePagePathInMenus } from "@compoz/core/domain/site/helpers/replace-page-path-in-menus";

export function updatePage({
  pages,
  // Optional dependency used to update menu hrefs after a slug rename.
  site,
  nowIso = () => new Date().toISOString(),
}: UpdatePageDeps) {
  return async function run(input: UpdatePageInput): Promise<UpdatePageResult> {
    const pageId = String(input.pageId ?? "").trim();

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
      });
    }

    const existing = await readExistingPageById({
      pages,
      state: DEFAULT_CONTENT_STATE,
      pageId,
    });

    const next: Page = { ...existing };
    const changed: ChangedKey[] = [];

    applyNamePatch({ existing, next, changed, input });
    applySeoTitlePatch({ existing, next, changed, input });
    applySeoDescriptionPatch({ existing, next, changed, input });

    const slugChange = await applySlugPatch({
      existing,
      next,
      changed,
      input,
      pages,
      state: DEFAULT_CONTENT_STATE,
    });

    applyParentIdPatch({ existing, next, changed, input });
    applyPaginationEnabledPatch({ existing, next, changed, input });
    applySitemapPatch({ existing, next, changed, input });

    if (changed.length === 0) {
      return { page: existing };
    }

    const menuUpdate =
      slugChange && site
        ? await prepareMenusForSlugRename({
            site,
            state: DEFAULT_CONTENT_STATE,
            fromSlug: slugChange.from,
            toSlug: slugChange.to,
          })
        : null;

    next.meta = { ...existing.meta, updatedAt: nowIso() };

    await pages.put(DEFAULT_CONTENT_STATE, next);

    if (menuUpdate?.changed && site) {
      await site.putSettings(DEFAULT_CONTENT_STATE, menuUpdate.settings);
    }

    // Cache invalidation stays outside the core domain.
    return { page: next };
  };
}

async function readExistingPageById({
  pages,
  state,
  pageId,
}: {
  pages: UpdatePageDeps["pages"];
  state: ContentState;
  pageId: string;
}): Promise<Page> {
  const existing = await pages.readById(state, pageId);

  if (!existing) {
    throw new DomainError({
      code: EC.PAGE_NOT_FOUND,
      message: EC.PAGE_NOT_FOUND,
    });
  }

  return existing;
}

async function prepareMenusForSlugRename(args: {
  site: NonNullable<UpdatePageDeps["site"]>;
  state: ContentState;
  fromSlug: string;
  toSlug: string;
}) {
  const { site, state, fromSlug, toSlug } = args;
  const settings = await site.readSettings(state);

  return replacePagePathInMenus({
    settings,
    fromSlug,
    toSlug,
  });
}
