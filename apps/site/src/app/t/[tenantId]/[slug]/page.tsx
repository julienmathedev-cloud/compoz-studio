/**
 * @file apps/site/src/app/t/[tenantId]/[slug]/page.tsx
 * @layer site/app
 *
 * @description
 * Fallback multi-website : "/t/[tenantId]/[slug]" -> rend une page published du website.
 *
 * @remarks
 * Le segment de route `[tenantId]` est conservé pour éviter un rename Next large,
 * mais sa valeur est maintenant interprétée comme un Website.slug.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import {
  getPublishedIndexByTenantId,
  getPublishedPageBySlugByTenantId,
  getPublishedSettingsByTenantId,
} from "@compoz/site/lib/pages/published-page-loaders";
import {
  buildSiteJsonLd,
  serializeSiteJsonLd,
} from "@compoz/site/lib/seo/buildSiteJsonLd";
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
  params: Promise<
    Readonly<{
      tenantId: string;
      slug: string;
    }>
  >;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function applyTitleTemplate(
  title: string | undefined,
  template: string,
): string | undefined {
  if (!title) {
    return undefined;
  }

  return template.replace("%s", title);
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tenantId: websiteSlug, slug } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlug,
  });

  if (!website) {
    return {};
  }

  if (slug === HOME_SLUG) {
    return {};
  }

  const websiteId = website.websiteId;

  const page = await getPublishedPageBySlugByTenantId(websiteId, slug);

  if (!page) {
    return {};
  }

  const settings = await getPublishedSettingsByTenantId(websiteId);

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
    h1 ||
    (page.name ?? "").trim() ||
    defaultSeoTitle ||
    brandTitle;

  const titleTemplate = ensureTitleTemplate(
    (settings?.seo?.titleTemplate ?? "").trim(),
    brandTitle ?? defaultSeoTitle ?? "Site",
  );

  const resolvedTitle = applyTitleTemplate(title, titleTemplate);

  return {
    title,
    description,
    alternates: {
      canonical: `/t/${encodeURIComponent(website.slug)}/${encodeURIComponent(page.slug)}`,
    },
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

export default async function SiteTenantPage({ params }: PageParams) {
  const { tenantId: websiteSlug, slug } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlug,
  });

  if (!website) {
    return notFound();
  }

  if (slug === HOME_SLUG) {
    return redirect(`/t/${encodeURIComponent(website.slug)}`);
  }

  const websiteId = website.websiteId;

  const index = await getPublishedIndexByTenantId(websiteId);

  if (!index) {
    return notFound();
  }

  const page = await getPublishedPageBySlugByTenantId(websiteId, slug);

  if (!page) {
    return notFound();
  }

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const tenantPrefix = `/t/${encodeURIComponent(website.slug)}`;

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (s) =>
      s === HOME_SLUG
        ? tenantPrefix
        : `${tenantPrefix}/${encodeURIComponent(s)}`,
  });

  const ui = resolveSiteUi(websiteId);
  const runtimeFeatures = resolveSiteRuntimeFeatures(websiteId);
  const settings = await getPublishedSettingsByTenantId(websiteId);
  const revealPreset = settings?.theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  const jsonLd = settings
    ? buildSiteJsonLd({
        settings,
        page,
        index,
        pathname: `${tenantPrefix}/${encodeURIComponent(page.slug)}`,
      })
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeSiteJsonLd(jsonLd) }}
        />
      ) : null}

      <SitePageRenderer
        ui={ui}
        blocks={blocks}
        pager={pager}
        revealUi={revealUi}
        runtimeFeatures={runtimeFeatures}
      />
    </>
  );
}

SiteTenantPage.displayName = "SiteTenantPage";
