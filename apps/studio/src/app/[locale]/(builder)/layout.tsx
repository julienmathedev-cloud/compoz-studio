/**
 * @file apps/studio/src/app/[locale]/(builder)/layout.tsx
 * @layer studio/app
 *
 * @description
 * Layout localisé i18n (Builder Studio).
 *
 * @remarks
 * - Initialise la locale (`setRequestLocale`).
 * - Monte les providers globaux (React Query, thème, sidebar, toasts, etc.).
 * - S’arrête volontairement au `StudioShell`.
 * - La composition visuelle builder (sidebar + header + main + drawer)
 *   est portée par `BuilderScreen` pour conserver un seul arbre RHF partagé.
 */

import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Toaster } from "sonner";

import { StudioClientProviders } from "@compoz/studio/app/[locale]/StudioClientProviders";
import { getSessionWithTenantOrNull } from "@compoz/studio/auth/require-session";
import { StudioShell } from "@compoz/studio/features/shell/components/StudioShell";
import { routing } from "@compoz/studio/i18n/routing";
import { ReactQueryProvider } from "@compoz/studio/lib/react-query/ReactQueryProvider";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { toTenantId } from "@compoz/ui/lib/tenant-id";

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

  const session = await getSessionWithTenantOrNull();

  if (!session) {
    redirect(`/${locale}/signin?next=/${locale}`);
  }

  const tenantId = toTenantId(session.tenantId);
  if (!tenantId) notFound();

  return (
    <ReactQueryProvider>
      <NextIntlClientProvider messages={messages}>
        <StudioClientProviders tenantId={tenantId} hasSidebar={false}>
          <main className="flex h-dvh min-h-0 min-w-0">
            <StudioShell>{children}</StudioShell>
          </main>
          <Toaster />
        </StudioClientProviders>
      </NextIntlClientProvider>
    </ReactQueryProvider>
  );
}
