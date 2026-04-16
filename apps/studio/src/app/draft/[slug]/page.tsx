/**
 * @file apps/studio/src/app/draft/[slug]/page.tsx
 * @layer studio/app
 *
 * @description
 * Route publique "/draft/[slug]" : rendu DRAFT-only (preview).
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { DraftPageRenderer } from "@compoz/studio/features/draft/DraftPageRenderer";
import {
  getDraftIndexByTenantId,
  getDraftPageBySlugByTenantId,
  getTenantId,
} from "@compoz/studio/lib/pages/draft-page-loaders";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type PageParams = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function hrefForDraftSlug(slug: string): string {
  const s = toSlug(slug);
  if (!s || s === HOME_SLUG) return "/draft";
  return `/draft/${encodeURIComponent(s)}`;
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await unwrapParams(params);

  const s = toSlug(slug);
  if (!s || s === HOME_SLUG) return {};

  const tenantId = await getTenantId();
  const page = await getDraftPageBySlugByTenantId(tenantId, s);

  if (!page) return {};

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const h1 = getPageH1(blocks);

  const title =
    (page.seoTitle ?? "").trim() || h1 || (page.name ?? "").trim() || undefined;

  return { title };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function DraftPage({ params }: PageParams) {
  const { slug } = await unwrapParams(params);

  const s = toSlug(slug);
  if (!s || s === HOME_SLUG) redirect("/draft");

  const tenantId = await getTenantId();

  const index = await getDraftIndexByTenantId(tenantId);
  if (!index) notFound();

  const page = await getDraftPageBySlugByTenantId(tenantId, s);
  if (!page) notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: hrefForDraftSlug,
  });

  return <DraftPageRenderer blocks={blocks} pager={pager} />;
}

DraftPage.displayName = "DraftPage";
