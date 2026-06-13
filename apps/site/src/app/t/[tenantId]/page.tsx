/**
 * @file apps/site/src/app/t/[tenantId]/page.tsx
 * @layer site/app
 *
 * @description
 * Fallback multi-tenant : "/t/[tenantId]" -> rend la home published du tenant.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import {
  getPublishedHomePageByTenantId,
  getPublishedIndexByTenantId,
  getPublishedSettingsByTenantId,
} from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { ensureTitleTemplate } from "@compoz/ui/lib/seo/metadata-helpers";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type PageParams = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function applyTitleTemplate(
  title: string | undefined,
  template: string,
): string | undefined {
  if (!title) return undefined;

  return template.replace("%s", title);
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tenantId } = await unwrapParams(params);

  const page = await getPublishedHomePageByTenantId(tenantId);
  if (!page) return {};

  const settings = await getPublishedSettingsByTenantId(tenantId);

  const defaultSeoTitle =
    (settings?.seo?.defaultTitle ?? "").trim() || undefined;

  const brandTitle = (settings?.identity?.siteName ?? "").trim() || undefined;

  const description =
    (page.seoDescription ?? "").trim() ||
    (settings?.seo?.defaultDescription ?? "").trim() ||
    undefined;

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const h1 = getPageH1(blocks);

  const title =
    (page.seoTitle ?? "").trim() ||
    defaultSeoTitle ||
    h1 ||
    (page.name ?? "").trim() ||
    brandTitle;

  const titleTemplate = ensureTitleTemplate(
    (settings?.seo?.titleTemplate ?? "").trim(),
    brandTitle ?? defaultSeoTitle ?? "Site",
  );

  const resolvedTitle = applyTitleTemplate(title, titleTemplate);

  return {
    title: resolvedTitle,
    description,
    alternates: { canonical: `/t/${encodeURIComponent(tenantId)}` },
    openGraph: {
      title: resolvedTitle,
      description,
    },
    twitter: {
      title: resolvedTitle,
      description,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SiteTenantRootPage({ params }: PageParams) {
  const { tenantId } = await unwrapParams(params);

  const index = await getPublishedIndexByTenantId(tenantId);
  if (!index) return notFound();

  const page = await getPublishedHomePageByTenantId(tenantId);
  if (!page) return notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const tenantPrefix = `/t/${encodeURIComponent(tenantId)}`;

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (slug) =>
      slug === HOME_SLUG ? tenantPrefix : `${tenantPrefix}/${slug}`,
  });

  const ui = resolveSiteUi(tenantId);
  const runtimeFeatures = resolveSiteRuntimeFeatures(tenantId);
  const settings = await getPublishedSettingsByTenantId(tenantId);
  const revealPreset = settings?.theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  return (
    <SitePageRenderer
      ui={ui}
      blocks={blocks}
      pager={pager}
      revealUi={revealUi}
      runtimeFeatures={runtimeFeatures}
    />
  );
}
