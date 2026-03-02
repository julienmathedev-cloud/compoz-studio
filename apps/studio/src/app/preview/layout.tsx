/**
 * @file apps/studio/src/app/preview/layout.tsx
 * @layer app/preview
 *
 * @description
 * Layout racine de la preview (iframe admin).
 *
 * @remarks
 * - Layout server (par défaut Next) : contient uniquement le wrapper.
 * - Le chrome (Header/Footer + skin) est géré par `PreviewShell` (client),
 *   car il dépend des baselines via `usePreviewOverride()`.
 */

import { cn } from "@compoz/ui/lib/utils";
import { PUBLIC_APP_SHELL } from "@compoz/ui/styles/site/layout";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";

type PreviewLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function PreviewLayout({ children }: PreviewLayoutProps) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={cn(PUBLIC_APP_SHELL)}>{children}</div>
    </NextIntlClientProvider>
  );
}
