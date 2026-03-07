/**
 * @file apps/studio/src/app/draft/layout.tsx
 * @layer studio/app
 *
 * @description
 * Layout studio pour le draft : définit les metadata SEO globales à partir des settings DRAFT.
 *
 * @remarks
 * - Convention V0.5 : draft = "/draft" (pas de querystring state).
 */

import type { Metadata } from "next";
import type { Icons } from "next/dist/lib/metadata/types/metadata-types";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ScrollTopOnRouteChange } from "@compoz/ui/hooks/behaviors/ScrollTopOnRouteChange";
import { SiteFooter } from "@compoz/ui/site/components/layouts/SiteFooter";
import { SiteHeader } from "@compoz/ui/site/components/layouts/SiteHeader";
import { SiteUiProvider } from "@compoz/ui/site/providers/SiteUiProvider";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";
import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";

import {
  ensureTitleTemplate,
  resolveAssetUrl,
  resolveIconHref,
  toSafeUrl,
} from "@compoz/ui/lib/seo/metadata-helpers";

import { getDraftSettings } from "@compoz/studio/lib/pages/draft-page-loaders";

import { cn } from "@compoz/ui/lib/utils";
import {
  SITE_APP_COLUMN,
  SITE_APP_SHELL,
  SITE_MAIN,
} from "@compoz/ui/styles/site/layout";

type LayoutProps = Readonly<{
  children: ReactNode;
}>;

function buildFaviconIcons(favicon: string): Icons {
  // Variante “favicon-32.png” (génération des sizes)
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
        { url: favicon.replace("-32.png", "-180.png"), sizes: "180x180" },
      ],
      shortcut: [{ url: favicon }],
    };
  }

  // Fallback simple : on ne “devine” pas les tailles
  return {
    icon: [{ url: favicon }],
    shortcut: [{ url: favicon }],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getDraftSettings();
  if (!settings) return {};

  const brandTitle = (settings.identity?.siteName ?? "").trim() || "Site";
  const defaultTitle = (settings.seo?.defaultTitle ?? "").trim() || brandTitle;

  const titleTemplate = ensureTitleTemplate(
    (settings.seo?.titleTemplate ?? "").trim(),
    brandTitle,
  );

  const description =
    (settings.seo?.defaultDescription ?? "").trim() ||
    `${brandTitle} — Prévisualisation.`;

  const metadataBase =
    toSafeUrl(settings.seo?.baseUrl) ?? toSafeUrl(settings.seo?.canonicalUrl);

  const favicon = resolveIconHref(settings.identity?.faviconUrl);

  const ogImage = resolveAssetUrl(
    settings.seo?.openGraph?.defaultImageUrl,
    metadataBase,
  );

  const robotsContent = (settings.seo?.robots ?? "").trim() || undefined;

  return {
    metadataBase,
    title: { default: defaultTitle, template: titleTemplate },
    description,
    robots: robotsContent,
    icons: favicon ? buildFaviconIcons(favicon) : undefined,
    openGraph: {
      title: defaultTitle,
      description,
      type: "website",
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

export default async function DraftLayout({ children }: LayoutProps) {
  const settings = await getDraftSettings();
  if (!settings) notFound();

  const ui = resolveSiteUi();

  return (
    <div className={cn(SITE_APP_SHELL)}>
      <SiteUiProvider ui={ui}>
        <ScrollTopOnRouteChange />
        <div className={cn(SITE_APP_COLUMN)}>
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
            legalMenu={toLegalMenuSettingsShapeFromDTO(settings.legalMenu)}
            ui={ui.footer}
          />
        </div>
      </SiteUiProvider>
    </div>
  );
}
