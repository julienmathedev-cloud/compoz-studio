/**
 * @file apps/site/src/app/(hosted)/page.tsx
 * @layer site/app
 *
 * @description
 * Route "/" : rend la page publiée "home" (SEO stable).
 *
 * @remarks
 * - PUBLISHED-only pour garder un head/metadata stable.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import {
  getPublishedHomePageByWebsiteId,
  getPublishedIndexByWebsiteId,
  getPublishedSettingsByWebsiteId,
  getWebsite,
} from "@compoz/site/lib/pages/published-page-loaders";
import { buildPageMetadata } from "@compoz/site/lib/seo/buildPageMetadata";
import {
  buildSiteJsonLd,
  serializeSiteJsonLd,
} from "@compoz/site/lib/seo/buildSiteJsonLd";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { ensureTitleTemplate } from "@compoz/ui/lib/seo/metadata-helpers";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

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

export async function generateMetadata(): Promise<Metadata> {
  const website = await getWebsite();
  const websiteId = website.websiteId;

  const page = await getPublishedHomePageByWebsiteId(websiteId);

  if (!page) return {};

  const settings = await getPublishedSettingsByWebsiteId(websiteId);

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

  return buildPageMetadata({
    settings,
    title: resolvedTitle,
    description,
    pathname: SITE_PATH.home,
    brandTitle,
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SiteRootPage() {
  const website = await getWebsite();
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const ui = resolveSiteUi(websiteSlug);
  const runtimeFeatures = resolveSiteRuntimeFeatures(websiteSlug);

  const settings = await getPublishedSettingsByWebsiteId(websiteId);
  const revealPreset = settings?.theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  const index = await getPublishedIndexByWebsiteId(websiteId);
  if (!index) return notFound();

  const page = await getPublishedHomePageByWebsiteId(websiteId);
  if (!page) return notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (slug) =>
      slug === HOME_SLUG ? SITE_PATH.home : `/${encodeURIComponent(slug)}`,
  });

  const jsonLd = settings
    ? buildSiteJsonLd({
        settings,
        page,
        index,
        pathname: SITE_PATH.home,
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

SiteRootPage.displayName = "SiteRootPage";
