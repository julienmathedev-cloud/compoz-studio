/**
 * @file apps/studio/src/app/draft/[slug]/page.tsx
 * @layer app/studio/draft
 *
 * @description
 * Route publique "/draft/[slug]" : rendu DRAFT-only (preview).
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";

import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";
import {
  getDraftIndex,
  getDraftPageBySlug,
} from "@compoz/studio/lib/pages/draft-page-loaders";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function __hrefForSlug(slug: string) {
  return slug === "home" ? "/draft" : `/draft/${slug}`;
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

  if (slug === "home") return {};

  const page = await getDraftPageBySlug(slug);
  if (!page) return {};

  return { title: page.title };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function DraftPage({ params }: PageParams) {
  const { slug } = await unwrapParams(params);

  if (slug === "home") redirect("/draft");

  const index = await getDraftIndex();
  if (!index) notFound();

  const page = await getDraftPageBySlug(slug);
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

DraftPage.displayName = "DraftPage";
