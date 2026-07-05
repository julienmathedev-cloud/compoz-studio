/**
 * @file apps/site/src/app/(hosted)/[slug]/page.tsx
 * @layer site/app
 *
 * @description
 * Route "/[slug]" : rendu PUBLISHED-only d’une page publique host-based.
 *
 * @remarks
 * Multi-website host-based :
 * - Le Website est résolu via le host public et Prisma WebsiteDomain.
 * - Les loaders de contenu utilisent le Prisma Website.id.
 * - L’UI/skin utilise le Website.slug.
 * - Les loaders explicites évitent une dépendance implicite à `headers()`
 *   en dehors de la résolution centralisée du Website.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import {
  getPublishedIndexByWebsiteId,
  getPublishedPageBySlugByWebsiteId,
  getPublishedSettingsByWebsiteId,
  getWebsite,
} from "@compoz/site/lib/pages/published-page-loaders";
import { buildPageMetadata } from "@compoz/site/lib/seo/buildPageMetadata";
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

export const dynamic = "force-dynamic";

type PageParams = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
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
  const { slug } = await unwrapParams(params);

  if (slug === HOME_SLUG) return {};

  const website = await getWebsite();
  const websiteId = website.websiteId;

  const page = await getPublishedPageBySlugByWebsiteId(websiteId, slug);

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
    .filter((block): block is BlockShape => Boolean(block));

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
  const pathname = `/${encodeURIComponent(slug)}`;

  return buildPageMetadata({
    settings,
    title,
    description,
    pathname,
    brandTitle,
    socialTitle: resolvedTitle,
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SitePage({ params }: PageParams) {
  const { slug } = await unwrapParams(params);

  if (slug === HOME_SLUG) return redirect(SITE_PATH.home);

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

  const page = await getPublishedPageBySlugByWebsiteId(websiteId, slug);
  if (!page) return notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((block): block is BlockShape => Boolean(block));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (pageSlug) =>
      pageSlug === HOME_SLUG
        ? SITE_PATH.home
        : `/${encodeURIComponent(pageSlug)}`,
  });

  const pathname = `/${encodeURIComponent(slug)}`;

  const jsonLd = settings
    ? buildSiteJsonLd({
        settings,
        page,
        index,
        pathname,
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

SitePage.displayName = "SitePage";
