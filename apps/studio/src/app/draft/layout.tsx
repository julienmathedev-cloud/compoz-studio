/**
 * @file apps/studio/src/app/draft/layout.tsx
 * @layer app/studio/draft
 *
 * @description
 * Layout public : définit les metadata SEO globales à partir des settings DRAFT.
 *
 * @remarks
 * - Convention V0.5 : draft = "/draft" (pas de querystring state).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ScrollTopOnRouteChange } from "@compoz/ui/hooks/behaviors/ScrollTopOnRouteChange";
import { PublicFooter } from "@compoz/ui/site/components/layouts/PublicFooter";
import { PublicHeader } from "@compoz/ui/site/components/layouts/PublicHeader";
import { PublicUiProvider } from "@compoz/ui/site/providers/PublicUiProvider";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";

import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";
import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";

import { getDraftSettings } from "@compoz/studio/lib/pages/draft-page-loaders";

import { cn } from "@compoz/ui/lib/utils";
import {
  PUBLIC_APP_COLUMN,
  PUBLIC_APP_SHELL,
  PUBLIC_MAIN,
} from "@compoz/ui/styles/site/layout";

type LayoutProps = Readonly<{
  children: ReactNode;
}>;

function safeUrl(input: string | null | undefined): URL | undefined {
  const s = (input ?? "").trim();
  if (!s) return undefined;

  try {
    return new URL(s);
  } catch {
    return undefined;
  }
}

function resolveAssetUrl(
  raw: string | null | undefined,
  metadataBase?: URL,
): string | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;

  const abs = safeUrl(s);
  if (abs) return abs.toString();

  if (metadataBase) {
    try {
      return new URL(s, metadataBase).toString();
    } catch {
      return s;
    }
  }

  return s;
}

function ensureTitleTemplate(template: string, siteTitle: string): string {
  const t = template.trim();
  if (!t) return `%s — ${siteTitle}`;
  if (t.includes("%s")) return t;
  return `%s — ${siteTitle}`;
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
    safeUrl(settings.seo?.baseUrl) ?? safeUrl(settings.seo?.canonicalUrl);

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
    icons: favicon
      ? {
          icon: [
            {
              url: favicon.replace("-32.png", "-16.png"),
              sizes: "16x16",
              type: "image/png",
            },
            {
              url: favicon.replace("-32.png", "-32.png"),
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
        }
      : undefined,
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

  const ui = resolvePublicUi();

  return (
    <div className={cn(PUBLIC_APP_SHELL)}>
      <PublicUiProvider ui={ui}>
        <ScrollTopOnRouteChange />
        <div className={cn(PUBLIC_APP_COLUMN)}>
          <PublicHeader
            header={settings.header}
            identity={settings.identity}
            primaryMenu={toPrimaryMenuSettingsShapeFromDTO(
              settings.primaryMenu,
            )}
            social={toSocialSettingsShapeFromDTO(settings.social)}
            ui={ui.header}
          />

          <main id="main-content" className={cn(PUBLIC_MAIN)}>
            {children}
          </main>

          <PublicFooter
            footer={settings.footer}
            legalMenu={toLegalMenuSettingsShapeFromDTO(settings.legalMenu)}
            ui={ui.footer}
          />
        </div>
      </PublicUiProvider>
    </div>
  );
}

function resolveIconHref(raw: string | null | undefined): string | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;

  const abs = safeUrl(s);
  if (abs) return abs.toString();

  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return `https://${s}`;

  return s;
}
