/**
 * @file apps/site/src/app/t/[websiteSlug]/[slug]/page.tsx
 * @layer site/app
 *
 * @description
 * Fallback public explicite : `/t/:websiteSlug/:pageSlug` rend une page publiée du Website.
 *
 * @remarks
 * - Le segment `websiteSlug` correspond au Prisma `Website.slug`.
 * - Le segment `slug` correspond au slug de la page publiée.
 * - Le Website est résolu via Prisma avant le chargement du contenu.
 * - Les loaders de contenu utilisent le Prisma `Website.id`.
 * - L’UI/skin et les URLs fallback utilisent le Prisma `Website.slug`.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import {
  getPublishedIndexByWebsiteId,
  getPublishedPageBySlugByWebsiteId,
  getPublishedSettingsByWebsiteId,
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
      websiteSlug: string;
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

async function resolveWebsiteFromParams(params: PageParams["params"]) {
  const { websiteSlug } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlug,
  });

  if (!website) {
    notFound();
  }

  return website;
}

function fallbackPathForPageSlug(params: {
  websiteSlug: string;
  pageSlug: string;
}): string {
  const { websiteSlug, pageSlug } = params;
  const websitePrefix = `/t/${encodeURIComponent(websiteSlug)}`;

  return pageSlug === HOME_SLUG
    ? websitePrefix
    : `${websitePrefix}/${encodeURIComponent(pageSlug)}`;
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug: pageSlug } = await unwrapParams(params);

  if (pageSlug === HOME_SLUG) {
    return {};
  }

  const website = await resolveWebsiteFromParams(params);
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const page = await getPublishedPageBySlugByWebsiteId(websiteId, pageSlug);

  if (!page) {
    return {};
  }

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

  return {
    title,
    description,
    alternates: {
      canonical: fallbackPathForPageSlug({
        websiteSlug,
        pageSlug: page.slug,
      }),
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

export default async function WebsiteFallbackPage({ params }: PageParams) {
  const { slug: pageSlug } = await unwrapParams(params);

  const website = await resolveWebsiteFromParams(params);
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  if (pageSlug === HOME_SLUG) {
    return redirect(fallbackPathForPageSlug({ websiteSlug, pageSlug }));
  }

  const index = await getPublishedIndexByWebsiteId(websiteId);

  if (!index) {
    notFound();
  }

  const page = await getPublishedPageBySlugByWebsiteId(websiteId, pageSlug);

  if (!page) {
    notFound();
  }

  const settings = await getPublishedSettingsByWebsiteId(websiteId);

  const ui = resolveSiteUi(websiteSlug);
  const runtimeFeatures = resolveSiteRuntimeFeatures(websiteSlug);

  const revealPreset = settings?.theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((block): block is BlockShape => Boolean(block));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (targetPageSlug) =>
      fallbackPathForPageSlug({ websiteSlug, pageSlug: targetPageSlug }),
  });

  const pathname = fallbackPathForPageSlug({
    websiteSlug,
    pageSlug: page.slug,
  });

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

WebsiteFallbackPage.displayName = "WebsiteFallbackPage";
