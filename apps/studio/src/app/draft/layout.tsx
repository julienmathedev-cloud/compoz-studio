/**
 * @file apps/studio/src/app/draft/layout.tsx
 * @layer studio/app
 *
 * @description
 * Layout studio pour le draft : définit les metadata SEO globales à partir des settings DRAFT,
 * tout en forçant un comportement safe pour la preview.
 *
 * @remarks
 * - Convention V0.5 : draft = "/draft" (pas de querystring state).
 * - Le draft doit rester noindex/nofollow.
 * - Le favicon reste celui de Compoz Studio pour éviter toute confusion avec le site publié.
 */

import type { Metadata } from "next";
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

  const ogImage = resolveAssetUrl(
    settings.seo?.openGraph?.defaultImageUrl,
    metadataBase,
  );

  return {
    metadataBase,
    title: { default: defaultTitle, template: titleTemplate },
    description,

    /**
     * Draft/preview : toujours exclu de l’indexation.
     */
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },

    /**
     * Draft : on conserve le favicon Compoz Studio hérité du root layout.
     * On ne surcharge pas avec le favicon client ici.
     */
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
