/**
 * @file apps/site/src/app/page.tsx
 * @layer app/site
 *
 * @description
 * Route publique "/site" : rend la page publiée "home" (SEO stable).
 *
 * @remarks
 * - Cette route est volontairement PUBLISHED-only pour garantir un head/metadata stable.
 * - Le draft est accessible via /draft (route dédiée).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";

import type { BlockShape } from "@compoz/validation/pages/blocks/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";
import {
  getPublishedHomePage,
  getPublishedIndex,
} from "@compoz/site/lib/pages/public-page-loaders";

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedHomePage();
  if (!page) return {};

  return {
    title: (page.title ?? "").trim(),
    alternates: { canonical: "/site" },
  };
}

/* -------------------------------------------------------------------------- */
/* Pager (inchangé)                                                           */
/* -------------------------------------------------------------------------- */

function __hrefForSlug(slug: string) {
  return slug === "home" ? "/site" : `/site/${slug}`;
}

function __computePager(args: {
  page: Pick<Page, "id" | "parentId" | "paginationEnabled"> & {
    title?: string;
    slug?: string;
  };
  index: SiteIndex;
}) {
  const { page, index } = args;

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
    prev: prev ? { href: __hrefForSlug(prev.slug), label: prev.title } : null,
    next: next ? { href: __hrefForSlug(next.slug), label: next.title } : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function PublicRootPage() {
  const index = await getPublishedIndex();
  if (!index) notFound();

  const page = await getPublishedHomePage();
  if (!page) notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = __computePager({ page, index });

  return (
    <SitePageRenderer
      ui={resolvePublicUi()}
      pageTitle={page.title}
      blocks={blocks}
      pager={pager}
    />
  );
}
