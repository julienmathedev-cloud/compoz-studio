/**
 * @file apps/studio/src/app/[locale]/layout.tsx
 * @layer app/layout
 *
 * @description
 * Layout localisé i18n : fournit le contexte `NextIntlClientProvider` et initialise la locale.
 *
 * @remarks
 * - Ne contient pas <html> / <body> (réservés au root `app/layout.tsx`).
 * - Inclut le provider React Query.
 * - Génère les params statiques `[locale]` pour Next.js.
 */

import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@compoz/studio/i18n/routing";
import { ReactQueryProvider } from "@compoz/studio/lib/react-query/ReactQueryProvider";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type Locale = (typeof routing.locales)[number];

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<
    Readonly<{
      locale: string;
    }>
  >;
}>;

function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

// Génère les params statiques `[locale]`.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await unwrapParams(params);

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <ReactQueryProvider>
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </ReactQueryProvider>
  );
}
