/**
 * @file apps/studio/src/app/preview/layout.tsx
 * @layer app/preview
 */

import type { ReactNode } from "react";

import { PreviewProviders } from "@compoz/studio/features/preview/PreviewProviders";
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PreviewProviders>
        <div className={cn(SITE_APP_SHELL, fontVariablesClassName)}>
          {children}
        </div>
      </PreviewProviders>
    </NextIntlClientProvider>
  );
}
