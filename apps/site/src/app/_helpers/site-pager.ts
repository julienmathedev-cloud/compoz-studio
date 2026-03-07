/**
 * @file apps/site/src/app/_helpers/site-pager.ts
 * @layer site/app/helpers
 *
 * @description
 * Helpers App Router (site) : construction du pager (prev/next) pour `SitePageRenderer`.
 *
 * @remarks
 * - UI-only : consomme `SiteIndex` + un subset de `Page`.
 * - Défensif : si slug/title manquants → lien ignoré (null).
 * - Ne trie pas : respecte l'ordre fourni par `index.pages`.
 */

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";

export type SitePagerLink = Readonly<{ href: string; label: string }>;

export type SitePager = Readonly<{
  enabled: boolean;
  prev: SitePagerLink | null;
  next: SitePagerLink | null;
}>;

export type SitePagerPage = Pick<
  Page,
  "id" | "parentId" | "paginationEnabled"
> &
  Readonly<{
    title?: string;
    slug?: string;
  }>;

export type SlugHrefBuilder = (slug: string) => string;

/**
 * Calcule le pager (prev/next) pour une page, en se basant sur ses siblings
 * (même parentId) dans `index.pages`.
 */
export function computeSitePager(args: {
  page: SitePagerPage;
  index: SiteIndex;
  hrefForSlug: SlugHrefBuilder;
}): SitePager {
  const { page, index, hrefForSlug } = args;

  const enabled = Boolean(page.paginationEnabled);
  if (!enabled) return { enabled: false, prev: null, next: null };

  const siblings = (index.pages ?? []).filter(
    (p) => p.parentId === page.parentId,
  );
  if (siblings.length <= 1) return { enabled: true, prev: null, next: null };

  const i = siblings.findIndex((p) => p.id === page.id);
  if (i < 0) return { enabled: true, prev: null, next: null };

  const prev = i > 0 ? siblings[i - 1] : null;
  const next = i < siblings.length - 1 ? siblings[i + 1] : null;

  return {
    enabled: true,
    prev:
      prev?.slug && prev?.title
        ? { href: hrefForSlug(prev.slug), label: prev.title }
        : null,
    next:
      next?.slug && next?.title
        ? { href: hrefForSlug(next.slug), label: next.title }
        : null,
  };
}
