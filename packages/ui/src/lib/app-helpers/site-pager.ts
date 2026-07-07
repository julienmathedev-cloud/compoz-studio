/**
 * @file packages/ui/src/lib/app-helpers/site-pager.ts
 * @layer ui/site/app-helpers
 * @description Shared prev/next pager helper for `SitePageRenderer`.
 * @remarks
 * Preserves the order from `index.pages`, scopes navigation to sibling pages, and ignores incomplete links defensively.
 */

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";

export type SitePagerLink = Readonly<{
  href: string;
  label: string;
}>;

export type SitePager = Readonly<{
  enabled: boolean;
  prev: SitePagerLink | null;
  next: SitePagerLink | null;
}>;

export type SitePagerPage = Pick<
  Page,
  "id" | "parentId" | "paginationEnabled" | "name" | "slug"
>;

export type SlugHrefBuilder = (slug: string) => string;

export function computeSitePager(args: {
  page: SitePagerPage;
  index: SiteIndex;
  hrefForSlug: SlugHrefBuilder;
}): SitePager {
  const { page, index, hrefForSlug } = args;

  const enabled = Boolean(page.paginationEnabled);

  if (!enabled) {
    return {
      enabled: false,
      prev: null,
      next: null,
    };
  }

  const siblings = (index.pages ?? []).filter(
    (item) => item.parentId === page.parentId,
  );

  if (siblings.length <= 1) {
    return {
      enabled: true,
      prev: null,
      next: null,
    };
  }

  const currentIndex = siblings.findIndex((item) => item.id === page.id);

  if (currentIndex < 0) {
    return {
      enabled: true,
      prev: null,
      next: null,
    };
  }

  const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const next =
    currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  return {
    enabled: true,
    prev:
      prev?.slug && prev?.name
        ? {
            href: hrefForSlug(prev.slug),
            label: prev.name,
          }
        : null,
    next:
      next?.slug && next?.name
        ? {
            href: hrefForSlug(next.slug),
            label: next.name,
          }
        : null,
  };
}
