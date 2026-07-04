/**
 * @file apps/studio/src/app/preview/layout.tsx
 * @layer studio/app/preview
 *
 * @description
 * Layout de la preview Studio pour le Website actif.
 *
 * @remarks
 * - Les données draft sont chargées via Prisma Website.id.
 * - La skin UI est résolue via Website.slug.
 * - Le provider preview reçoit le Website.slug actif.
 */

import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { PreviewProviders } from "@compoz/studio/features/preview/PreviewProviders";
import {
  getDraftSettingsByWebsiteId,
  getWebsite,
} from "@compoz/studio/lib/pages/draft-page-loaders";
import { allFontVariablesClassName } from "@compoz/ui/lib/fonts";
import { cn } from "@compoz/ui/lib/utils";
import { resolveSiteSkinCssHref } from "@compoz/ui/site/skins/resolveSiteUi";
import {
  SITE_APP_SHELL,
  SITE_APP_SURFACE,
} from "@compoz/ui/styles/site/layout";

type PreviewLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function PreviewLayout({ children }: PreviewLayoutProps) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  const website = await getWebsite();
  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const settings = await getDraftSettingsByWebsiteId(websiteId);
  const initialTheme = settings?.theme ?? null;
  const skinCssHref = resolveSiteSkinCssHref(websiteSlug);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {skinCssHref ? <link rel="stylesheet" href={skinCssHref} /> : null}

      <div className={cn(allFontVariablesClassName)}>
        <PreviewProviders websiteSlug={websiteSlug} initialTheme={initialTheme}>
          <div
            className={cn(SITE_APP_SHELL, SITE_APP_SURFACE)}
            data-scroll-root
          >
            {children}
          </div>
        </PreviewProviders>
      </div>
    </NextIntlClientProvider>
  );
}
