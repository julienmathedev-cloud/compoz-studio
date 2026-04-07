/**
 * @file apps/site/src/app/layout.tsx
 * @layer site/app
 *
 * @description
 * Layout site : définit les metadata SEO globales à partir des settings publiés.
 */

import type { Metadata } from "next";
import type { Icons } from "next/dist/lib/metadata/types/metadata-types";
import type { ReactNode } from "react";

import "@compoz/site/app/globals.css";

import { SiteNotFoundClient } from "@compoz/site/components/system/SiteNotFoundClient";
import { getPublishedSettings } from "@compoz/site/lib/pages/published-page-loaders";
import { resolveSiteBaseUrl } from "@compoz/site/lib/seo/resolveSiteBaseUrl";
import { ScrollTopOnRouteChange } from "@compoz/ui/hooks/behaviors/ScrollTopOnRouteChange";
import { fontVariablesClassName } from "@compoz/ui/lib/fonts";
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
import { SiteRuntimeProvider } from "@compoz/ui/site/providers/SiteRuntimeProvider";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import {
  SITE_APP_COLUMN,
  SITE_APP_SHELL,
  SITE_MAIN,
} from "@compoz/ui/styles/site/layout";

type LayoutProps = Readonly<{
  children: ReactNode;
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

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublishedSettings();
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

export default async function SiteLayout({ children }: LayoutProps) {
  const settings = await getPublishedSettings();
  const ui = resolveSiteUi();

  return (
    <html
      id="app-site"
      lang="fr"
      className={cn("overscroll-none h-dvh theme-site", fontVariablesClassName)}
    >
      <body className={cn("antialiased", SITE_APP_SHELL)}>
        <SiteRuntimeProvider ui={ui} theme={settings?.theme}>
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
              <SiteNotFoundClient />
            )}
          </div>
        </SiteRuntimeProvider>
      </body>
    </html>
  );
}
