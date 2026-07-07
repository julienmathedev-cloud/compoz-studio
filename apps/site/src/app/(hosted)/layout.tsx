/**
 * @file apps/site/src/app/(hosted)/layout.tsx
 * @layer site/app
 *
 * @description
 * Host-based public layout for published site routes.
 *
 * @remarks
 * - Used by standard public routes resolved from the request host, such as `/` and `/[slug]`.
 * - Resolves the active Website through Prisma WebsiteDomain.
 * - Loads published settings with Prisma Website.id, while UI and skin resolution use Website.slug.
 * - The explicit `/t/[websiteSlug]` fallback route has its own dedicated layout.
 */

import type { Metadata } from "next";
import type { Icons } from "next/dist/lib/metadata/types/metadata-types";
import type { CSSProperties, ReactNode } from "react";
import { preload } from "react-dom";

import { SiteNotFoundClient } from "@compoz/site/components/system/SiteNotFoundClient";
import {
  getPublishedSettingsByWebsiteId,
  getWebsite,
} from "@compoz/site/lib/pages/published-page-loaders";
import { resolveSiteBaseUrl } from "@compoz/site/lib/seo/resolveSiteBaseUrl";
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

type LayoutProps = Readonly<{
  children: ReactNode;
}>;

const GOOGLE_SITE_VERIFICATION_BY_WEBSITE_SLUG: Record<string, string> = {
  portfolio: process.env.GOOGLE_SITE_VERIFICATION_PORTFOLIO ?? "",
  demo: process.env.GOOGLE_SITE_VERIFICATION_DEMO ?? "",
};

/** Builds a complete favicon metadata set when the stored icon follows the generated size naming convention. */
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

export async function generateMetadata(): Promise<Metadata> {
  const website = await getWebsite();
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

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

  // Avoid indexing production sites until a canonical base URL or explicit robots directive is configured.
  const isProd = process.env.NODE_ENV === "production";
  const shouldForceNoindex = isProd && !metadataBase && !robotsContent;
  const robots =
    robotsContent ?? (shouldForceNoindex ? "noindex, nofollow" : undefined);

  const googleSiteVerification =
    GOOGLE_SITE_VERIFICATION_BY_WEBSITE_SLUG[websiteSlug]?.trim() || undefined;

  return {
    metadataBase,

    applicationName: brandTitle,

    title: {
      default: defaultTitle,
      template: titleTemplate,
    },

    description,

    robots,

    verification: googleSiteVerification
      ? {
          google: googleSiteVerification,
        }
      : undefined,

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

export default async function HostedSiteLayout({ children }: LayoutProps) {
  const website = await getWebsite();
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const settings = await getPublishedSettingsByWebsiteId(websiteId);
  const ui = resolveSiteUi(websiteSlug);

  const publicFonts = resolvePublicThemeFonts(
    settings?.theme?.fontFamily,
    settings?.theme?.headingFont,
  );

  // Skin CSS is resolved from the Website slug, not from the Prisma Website id.
  const skinCssHref = resolveSiteSkinCssHref(websiteSlug);

  const fontStyle = Object.fromEntries(
    publicFonts.map((font) => [font.variableName, font.fontFamily]),
  ) as CSSProperties;

  // Preload only the fonts selected by the published theme.
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
