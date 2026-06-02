/**
 * @file apps/studio/src/app/preview/layout.tsx
 * @layer app/preview
 */

import type { ReactNode } from "react";

import { PreviewProviders } from "@compoz/studio/features/preview/PreviewProviders";
import {
  getDraftSettingsByTenantId,
  getTenantId,
} from "@compoz/studio/lib/pages/draft-page-loaders";
import { allFontVariablesClassName } from "@compoz/ui/lib/fonts";
import { cn } from "@compoz/ui/lib/utils";
import { resolveSiteSkinCssHref } from "@compoz/ui/site/skins/resolveSiteUi";
import {
  SITE_APP_SHELL,
  SITE_APP_SURFACE,
} from "@compoz/ui/styles/site/layout";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

type PreviewLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function PreviewLayout({ children }: PreviewLayoutProps) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  const tenantId = await getTenantId();
  const settings = await getDraftSettingsByTenantId(tenantId);
  const initialTheme = settings?.theme ?? null;
  const skinCssHref = resolveSiteSkinCssHref(tenantId);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {skinCssHref ? <link rel="stylesheet" href={skinCssHref} /> : null}

      <div className={cn(allFontVariablesClassName)}>
        <PreviewProviders tenantId={tenantId} initialTheme={initialTheme}>
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
