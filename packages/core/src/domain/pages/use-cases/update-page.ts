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
import { SITE_PATH } from "@compoz/core/constants/web/paths";
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
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { toInternalPathFromSlug } from "@compoz/core/domain/slug/utils";

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

    if (changed.length === 0) return { page: existing };

    next.meta = { ...existing.meta, updatedAt: nowIso() };
    await pages.put(DEFAULT_CONTENT_STATE, next);

    if (slugChange && site) {
      await tryUpdateMenusForSlugRename({
        site,
        state: DEFAULT_CONTENT_STATE,
        fromSlug: slugChange.from,
        toSlug: slugChange.to,
      });
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
  await pages.ensureBase();
  const existing = await pages.readById(state, pageId);

  if (!existing) {
    throw new DomainError({
      code: EC.PAGE_NOT_FOUND,
      message: EC.PAGE_NOT_FOUND,
    });
  }

  return existing;
}

async function tryUpdateMenusForSlugRename(args: {
  site: NonNullable<UpdatePageDeps["site"]>;
  state: ContentState;
  fromSlug: string;
  toSlug: string;
}): Promise<void> {
  const { site, state, fromSlug, toSlug } = args;

  const fromPath = toInternalPathFromSlug(fromSlug);
  const toPath = toInternalPathFromSlug(toSlug);

  if (fromPath === toPath) return;

  try {
    await site.ensureBase();

    const settings = await site.readSettings(state);

    function patchItems<T extends { href: string }>(
      items: ReadonlyArray<T> | undefined,
    ) {
      const list = items ?? [];
      let changed = false;

      const nextItems = list.map((it) => {
        const href = String(it.href ?? "").trim();

        if (href === fromPath) {
          changed = true;
          return { ...it, href: toPath };
        }

        if (
          fromSlug === HOME_SLUG &&
          (href === `/${HOME_SLUG}` || href === HOME_SLUG)
        ) {
          changed = true;
          return { ...it, href: SITE_PATH.home };
        }

        return it;
      });

      return { nextItems, changed } as const;
    }

    const primary = patchItems(settings.primaryMenu?.items);
    const legal = patchItems(settings.legalMenu?.items);

    if (!primary.changed && !legal.changed) return;

    const nextSettings = {
      ...settings,

      primaryMenu: settings.primaryMenu
        ? { ...settings.primaryMenu, items: primary.nextItems }
        : settings.primaryMenu,

      legalMenu: settings.legalMenu
        ? { ...settings.legalMenu, items: legal.nextItems }
        : settings.legalMenu,
    };

    await site.putSettings(state, nextSettings);
  } catch {
    return;
  }
}
