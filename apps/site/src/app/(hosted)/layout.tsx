/**
 * @file apps/site/src/app/(hosted)/layout.tsx
 * @layer site/app
 *
 * @description
 * Layout public host-based du site.
 *
 * @remarks
 * - Utilisé pour les routes publiques standards résolues par host
 *   (ex: "/", "/[slug]").
 * - Charge les settings publiés via la résolution host-based.
 * - Le fallback explicite `/t/[tenantId]` possède son propre layout dédié.
 */

import type { Metadata } from "next";
import type { Icons } from "next/dist/lib/metadata/types/metadata-types";
import type { ReactNode } from "react";

import { SiteNotFoundClient } from "@compoz/site/components/system/SiteNotFoundClient";
import {
  getPublishedSettingsByTenantId,
  getTenantId,
} from "@compoz/site/lib/pages/published-page-loaders";
import { resolveSiteBaseUrl } from "@compoz/site/lib/seo/resolveSiteBaseUrl";
import { ScrollTopOnRouteChange } from "@compoz/ui/hooks/behaviors/ScrollTopOnRouteChange";
import { resolvePublicFontConfig } from "@compoz/ui/lib/public-fonts";
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
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import { SITE_APP_COLUMN, SITE_MAIN } from "@compoz/ui/styles/site/layout";
import type { CSSProperties } from "react";

type LayoutProps = Readonly<{
  children: ReactNode;
}>;

const GOOGLE_SITE_VERIFICATION_BY_TENANT_ID: Record<string, string> = {
  portfolio: process.env.GOOGLE_SITE_VERIFICATION_PORTFOLIO ?? "",

  demo: process.env.GOOGLE_SITE_VERIFICATION_DEMO ?? "",
};

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

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await getTenantId();
  const settings = await getPublishedSettingsByTenantId(tenantId);

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

  const googleSiteVerification =
    GOOGLE_SITE_VERIFICATION_BY_TENANT_ID[tenantId]?.trim() || undefined;

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

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export default async function HostedSiteLayout({ children }: LayoutProps) {
  const tenantId = await getTenantId();
  const settings = await getPublishedSettingsByTenantId(tenantId);
  const ui = resolveSiteUi(tenantId);
  const publicFont = resolvePublicFontConfig(settings?.theme?.fontFamily);

  const fontStyle = {
    [publicFont.variableName]: publicFont.fontFamily,
  } as CSSProperties;

  return (
    <>
      <link rel="stylesheet" href={publicFont.href} />

      <div style={fontStyle}>
        <SiteThemeBoundary theme={settings?.theme}>
          <ScrollTopOnRouteChange />

          <div className={cn(SITE_APP_COLUMN)}>
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
