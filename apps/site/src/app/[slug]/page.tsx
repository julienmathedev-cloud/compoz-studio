/**
 * @file apps/site/src/app/[slug]/page.tsx
 * @layer app/site
 *
 * @description
 * Route publique "/[slug]" : rendu PUBLISHED-only (SEO stable).
 *
 * @remarks
 * Multi-tenant host-based:
 * - dépend de `headers()` via getPublished* loaders
 * - donc pas compatible avec SSG (`generateStaticParams`) au build
 */

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";
import {
  getPublishedIndex,
  getPublishedPageBySlug,
} from "@compoz/site/lib/pages/public-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function __hrefForSlug(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
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

type PageParams = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
}>;

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await unwrapParams(params);

  // "home" est routée sur / (page dédiée), donc pas de metadata ici
  if (slug === "home") return {};

  const page = await getPublishedPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.title,
    alternates: { canonical: `/${slug}` },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function PublicPage({ params }: PageParams) {
  const { slug } = await unwrapParams(params);

  if (slug === "home") redirect("/");

  const index = await getPublishedIndex();
  if (!index) notFound();

  const page = await getPublishedPageBySlug(slug);
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
