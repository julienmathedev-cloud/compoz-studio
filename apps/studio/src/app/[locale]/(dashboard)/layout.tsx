/**
 * @file apps/studio/src/app/[locale]/(dashboard)/layout.tsx
 * @layer studio/app
 *
 * @description
 * Layout localisé i18n (Dashboard Studio) :
 * - initialise la locale (`setRequestLocale`)
 * - fournit `NextIntlClientProvider`
 * - monte les providers client globaux (React Query, thème, sidebar, toasts, etc.)
 *
 * @remarks
 * - Ne contient pas `<html>` / `<body>` (réservés au root `app/layout.tsx`).
 * - Génère les params statiques `[locale]` pour Next.js.
 */

import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Toaster } from "sonner";

import { StudioClientProviders } from "@compoz/studio/app/[locale]/StudioClientProviders";
import {
  getSessionWithTenantOrNull,
  isAdminRole,
} from "@compoz/studio/auth/require-session";
import { StudioSidebar } from "@compoz/studio/components/organisms/StudioSidebar";
import { Header } from "@compoz/studio/features/shell/components/Header";
import { StudioShell } from "@compoz/studio/features/shell/components/StudioShell";
import { routing } from "@compoz/studio/i18n/routing";
import { ReactQueryProvider } from "@compoz/studio/lib/react-query/ReactQueryProvider";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { SidebarInset } from "@compoz/ui/components/ui/sidebar";
import { toTenantId } from "@compoz/ui/lib/tenant-id";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_CONTAINER, STUDIO_PAGE } from "@compoz/ui/styles/studio/layout";

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

  const session = await getSessionWithTenantOrNull();

  if (!session) {
    redirect(`/${locale}/signin?next=/${locale}`);
  }

  // session.tenantId = tenant actif (cookie admin si présent) OU defaultTenantId
  const tenantId = toTenantId(session.tenantId);
  if (!tenantId) notFound();

  const isAdmin = isAdminRole(session.role);

  return (
    <ReactQueryProvider>
      <NextIntlClientProvider messages={messages}>
        <div className="flex h-dvh min-h-0 min-w-0">
          <StudioClientProviders tenantId={tenantId}>
            {/* StudioShell : protège les composants sensibles côté client (RHF, Radix Tabs, Dialog, useId, etc.). */}
            <StudioShell>
              {/* Colonne gauche */}
              <aside className="shrink-0">
                <StudioSidebar locale={locale} isAdmin={isAdmin} />
              </aside>

              {/* Colonne droite = tout le contenu “inset” */}
              <SidebarInset className="bg-sidebar flex flex-col min-w-0 min-h-0 h-full">
                {/* Header Studio : navigation + skip-link. */}
                <Header />

                {/* Zone principale : contenu des pages dashboard. */}
                <main
                  id="main"
                  className="flex-1 border border-primary/10 bg-background rounded-sm ml-2 md:ml-0 mb-2 mr-2 overflow-y-auto"
                  tabIndex={-1}
                >
                  <div className={cn(STUDIO_CONTAINER)}>
                    <div className={cn(STUDIO_PAGE)}>{children}</div>
                  </div>
                </main>

                {/* Toaster local Studio. */}
                <Toaster />
              </SidebarInset>
            </StudioShell>
          </StudioClientProviders>
        </div>
      </NextIntlClientProvider>
    </ReactQueryProvider>
  );
}
