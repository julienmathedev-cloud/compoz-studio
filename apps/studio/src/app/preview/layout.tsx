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
import { fontVariablesClassName } from "@compoz/ui/lib/fonts";
import { cn } from "@compoz/ui/lib/utils";
import { SITE_APP_SHELL } from "@compoz/ui/styles/site/layout";
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        className={cn(SITE_APP_SHELL, fontVariablesClassName)}
        data-scroll-root
      >
        <PreviewProviders tenantId={tenantId} initialTheme={initialTheme}>
          {children}
        </PreviewProviders>
      </div>
    </NextIntlClientProvider>
  );
}
