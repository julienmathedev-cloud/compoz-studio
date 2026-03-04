/**
 * @file apps/site/src/app/t/[tenantId]/[slug]/page.tsx
 * @layer app/site
 *
 * @description
 * Fallback multi-tenant : "/t/[tenantId]/[slug]" -> rend la page published du tenant.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities";
import {
  getPublishedIndexForTenant,
  getPublishedPageBySlugForTenant,
} from "@compoz/site/lib/pages/public-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type PageParams = Readonly<{
  params: Promise<Readonly<{ tenantId: string; slug: string }>>;
}>;

function __hrefForSlug(tenantId: string, slug: string) {
  return slug === "home" ? `/t/${tenantId}` : `/t/${tenantId}/${slug}`;
}

function __computePager(args: {
  tenantId: string;
  page: Pick<Page, "id" | "parentId" | "paginationEnabled"> & {
    title?: string;
    slug?: string;
  };
  index: SiteIndex;
}) {
  const { tenantId, page, index } = args;

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
    prev: prev
      ? { href: __hrefForSlug(tenantId, prev.slug), label: prev.title }
      : null,
    next: next
      ? { href: __hrefForSlug(tenantId, next.slug), label: next.title }
      : null,
  };
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tenantId, slug } = await unwrapParams(params);

  if (slug === "home") return {};

  const page = await getPublishedPageBySlugForTenant(tenantId, slug);
  if (!page) return {};

  return {
    title: page.title,
    alternates: { canonical: `/t/${tenantId}/${slug}` },
  };
}

export default async function PublicTenantPage({ params }: PageParams) {
  const { tenantId, slug } = await unwrapParams(params);

  if (slug === "home") redirect(`/t/${tenantId}`);

  const index = await getPublishedIndexForTenant(tenantId);
  if (!index) notFound();

  const page = await getPublishedPageBySlugForTenant(tenantId, slug);
  if (!page) notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = __computePager({ tenantId, page, index });

  return (
    <SitePageRenderer
      ui={resolvePublicUi()}
      pageTitle={page.title}
      blocks={blocks}
      pager={pager}
    />
  );
}
