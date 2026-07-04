/**
 * @file apps/site/src/app/t/[websiteSlug]/layout.tsx
 * @layer site/app
 *
 * @description
 * Layout public du fallback explicite `/t/:websiteSlug`.
 *
 * @remarks
 * - Le paramètre de route `websiteSlug` correspond au Prisma `Website.slug`.
 * - Le Website est résolu via Prisma avant de charger les settings publiés.
 * - Les loaders de contenu utilisent le Prisma `Website.id`.
 * - L’UI/skin utilise le Prisma `Website.slug`.
 * - Les routes host-based possèdent leur propre layout dans `(hosted)`.
 */

import type { Metadata } from "next";
import type { Icons } from "next/dist/lib/metadata/types/metadata-types";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { preload } from "react-dom";

import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import { SiteNotFoundClient } from "@compoz/site/components/system/SiteNotFoundClient";
import { getPublishedSettingsByWebsiteId } from "@compoz/site/lib/pages/published-page-loaders";
import { resolveSiteBaseUrl } from "@compoz/site/lib/seo/resolveSiteBaseUrl";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { ScrollTopOnRouteChange } from "@compoz/ui/hooks/behaviors/ScrollTopOnRouteChange";
import { resolvePublicThemeFonts } from "@compoz/ui/lib/public-fonts";
import {
  ensureTitleTemplate,
  resolveAssetUrl,
  resolveIconHref,
} from "@compoz/ui/lib/seo/metadata-helpers";
import { cn } from "@compoz/ui/lib/utils";
import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";
import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";
import { SiteFooter } from "@compoz/ui/site/components/layouts/SiteFooter";
import { SiteHeader } from "@compoz/ui/site/components/layouts/SiteHeader";
import { SiteThemeBoundary } from "@compoz/ui/site/providers/SiteThemeBoundary";
import {
  resolveSiteSkinCssHref,
  resolveSiteUi,
} from "@compoz/ui/site/skins/resolveSiteUi";
import {
  SITE_APP_COLUMN,
  SITE_APP_SURFACE,
  SITE_MAIN,
} from "@compoz/ui/styles/site/layout";

type WebsiteSlugLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<
    Readonly<{
      websiteSlug: string;
    }>
  >;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function buildFaviconIcons(favicon: string): Icons {
  if (favicon.includes("-32.png")) {
    return {
      icon: [
        {
          url: favicon.replace("-32.png", "-16.png"),
          sizes: "16x16",
          type: "image/png",
        },
        {
          url: favicon,
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: favicon.replace("-32.png", "-48.png"),
          sizes: "48x48",
          type: "image/png",
        },
        {
          url: favicon.replace("-32.png", "-192.png"),
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: favicon.replace("-32.png", "-512.png"),
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: favicon.replace("-32.png", "-180.png"),
          sizes: "180x180",
          type: "image/png",
        },
      ],
      shortcut: [{ url: favicon }],
    };
  }

  return {
    icon: [{ url: favicon }],
    shortcut: [{ url: favicon }],
  };
}

async function resolveWebsiteFromParams(
  params: WebsiteSlugLayoutProps["params"],
) {
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
}: Omit<WebsiteSlugLayoutProps, "children">): Promise<Metadata> {
  const website = await resolveWebsiteFromParams(params);
  const websiteId = website.websiteId;

  const settings = await getPublishedSettingsByWebsiteId(websiteId);

  if (!settings) return {};

  const brandTitle = (settings.identity?.siteName ?? "").trim() || "Site";
  const defaultTitle = (settings.seo?.defaultTitle ?? "").trim() || brandTitle;

  const titleTemplate = ensureTitleTemplate(
    (settings.seo?.titleTemplate ?? "").trim(),
    brandTitle,
  );

  const description =
    (settings.seo?.defaultDescription ?? "").trim() ||
    `${brandTitle} — Site officiel.`;

  const metadataBase = resolveSiteBaseUrl(settings.seo?.baseUrl) ?? undefined;
  const favicon = resolveIconHref(settings.identity?.faviconUrl);

  const ogImage = resolveAssetUrl(
    settings.seo?.openGraph?.defaultImageUrl,
    metadataBase,
  );

  const robotsContent = (settings.seo?.robots ?? "").trim() || undefined;
  const isProd = process.env.NODE_ENV === "production";
  const shouldForceNoindex = isProd && !metadataBase && !robotsContent;
  const robots =
    robotsContent ?? (shouldForceNoindex ? "noindex, nofollow" : undefined);

  return {
    metadataBase,
    applicationName: brandTitle,
    title: {
      default: defaultTitle,
      template: titleTemplate,
    },
    description,
    robots,
    icons: favicon ? buildFaviconIcons(favicon) : undefined,
    openGraph: {
      title: defaultTitle,
      description,
      type: "website",
      siteName: brandTitle,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: settings.seo?.twitter?.card ?? undefined,
      site: settings.seo?.twitter?.site ?? undefined,
      creator: settings.seo?.twitter?.creator ?? undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export default async function WebsiteSlugSiteLayout({
  children,
  params,
}: WebsiteSlugLayoutProps) {
  const website = await resolveWebsiteFromParams(params);
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const settings = await getPublishedSettingsByWebsiteId(websiteId);
  const ui = resolveSiteUi(websiteSlug);

  const publicFonts = resolvePublicThemeFonts(
    settings?.theme?.fontFamily,
    settings?.theme?.headingFont,
  );

  const skinCssHref = resolveSiteSkinCssHref(websiteSlug);

  const fontStyle = Object.fromEntries(
    publicFonts.map((font) => [font.variableName, font.fontFamily]),
  ) as CSSProperties;

  for (const font of publicFonts) {
    preload(font.preloadHref, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    });
  }

  return (
    <>
      {publicFonts.map((font) => (
        <link
          key={font.key}
          rel="stylesheet"
          href={font.href}
          precedence="font"
        />
      ))}
      {skinCssHref ? (
        <link rel="stylesheet" href={skinCssHref} precedence="skin" />
      ) : null}

      <div style={fontStyle}>
        <SiteThemeBoundary theme={settings?.theme}>
          <ScrollTopOnRouteChange />

          <div className={cn(SITE_APP_COLUMN, SITE_APP_SURFACE)}>
            {settings ? (
              <>
                <SiteHeader
                  header={settings.header}
                  identity={settings.identity}
                  primaryMenu={toPrimaryMenuSettingsShapeFromDTO(
                    settings.primaryMenu,
                  )}
                  social={toSocialSettingsShapeFromDTO(settings.social)}
                  ui={ui.header}
                />

                <main id="main-content" className={cn(SITE_MAIN)}>
                  {children}
                </main>

                <SiteFooter
                  footer={settings.footer}
                  legalMenu={toLegalMenuSettingsShapeFromDTO(
                    settings.legalMenu,
                  )}
                  ui={ui.footer}
                />
              </>
            ) : (
              <SiteNotFoundClient ui={ui.systemPage} />
            )}
          </div>
        </SiteThemeBoundary>
      </div>
    </>
  );
}
