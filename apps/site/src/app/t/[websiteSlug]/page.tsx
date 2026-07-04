/**
 * @file apps/site/src/app/t/[websiteSlug]/page.tsx
 * @layer site/app
 *
 * @description
 * Fallback public explicite : `/t/:websiteSlug` rend la home publiée du Website.
 *
 * @remarks
 * - Le segment de route `websiteSlug` correspond au Prisma `Website.slug`.
 * - Le Website est résolu via Prisma avant le chargement du contenu.
 * - Les loaders de contenu utilisent le Prisma `Website.id`.
 * - L’UI/skin et les URLs fallback utilisent le Prisma `Website.slug`.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import {
  getPublishedHomePageByWebsiteId,
  getPublishedIndexByWebsiteId,
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
  params: Promise<Readonly<{ websiteSlug: string }>>;
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

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const website = await resolveWebsiteFromParams(params);
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const page = await getPublishedHomePageByWebsiteId(websiteId);

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
    alternates: {
      canonical: `/t/${encodeURIComponent(websiteSlug)}`,
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

export default async function WebsiteFallbackRootPage({ params }: PageParams) {
  const website = await resolveWebsiteFromParams(params);
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const index = await getPublishedIndexByWebsiteId(websiteId);

  if (!index) {
    notFound();
  }

  const page = await getPublishedHomePageByWebsiteId(websiteId);

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

  const websitePrefix = `/t/${encodeURIComponent(websiteSlug)}`;

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (pageSlug) =>
      pageSlug === HOME_SLUG
        ? websitePrefix
        : `${websitePrefix}/${encodeURIComponent(pageSlug)}`,
  });

  const jsonLd = settings
    ? buildSiteJsonLd({
        settings,
        page,
        index,
        pathname: websitePrefix,
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

WebsiteFallbackRootPage.displayName = "WebsiteFallbackRootPage";
