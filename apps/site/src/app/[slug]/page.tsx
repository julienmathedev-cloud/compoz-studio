/**
 * @file apps/site/src/app/page.tsx
 * @layer app/site
 *
 * @description
 * Route publique "/site/[slug]" : rendu PUBLISHED-only (SEO stable).
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";
import {
  getPublishedIndex,
  getPublishedPageBySlug,
} from "@compoz/site/lib/pages/public-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
/**
 * ✅ Objectif V0.5 : head/metadata stables.
 * On force Next à pré-rendre les slugs connus (published).
 */
export async function generateStaticParams() {
  const index = await getPublishedIndex();

  const slugs =
    (index?.pages ?? [])
      .map((p) => String(p.slug ?? "").trim())
      .filter(Boolean)
      .filter((s) => s !== "home") ?? [];

  return slugs.map((slug) => ({ slug }));
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
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

  // "home" est routée sur /site (page dédiée), donc pas de metadata ici
  if (slug === "home") return {};

  const page = await getPublishedPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.title,
    alternates: {
      canonical: `/site/${slug}`,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function PublicPage({ params }: PageParams) {
  const { slug } = await unwrapParams(params);

  if (slug === "home") redirect("/site");

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
