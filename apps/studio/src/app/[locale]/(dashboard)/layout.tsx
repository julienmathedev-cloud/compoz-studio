/**
 * @file apps/studio/src/app/[locale]/(dashboard)/layout.tsx
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

import { AdminClientProviders } from "@compoz/studio/app/[locale]/AdminClientProviders";
import {
  isAdminRole,
  requireSessionWithTenant,
} from "@compoz/studio/auth/require-session";
import { AdminSidebar } from "@compoz/studio/components/organisms/AdminSidebar";
import { AdminShell } from "@compoz/studio/features/shell/components/AdminShell";
import { Header } from "@compoz/studio/features/shell/components/Header";
import { routing } from "@compoz/studio/i18n/routing";
import { ReactQueryProvider } from "@compoz/studio/lib/react-query/ReactQueryProvider";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { SidebarInset } from "@compoz/ui/components/ui/sidebar";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_CONTAINER, ADMIN_PAGE } from "@compoz/ui/styles/studio/layout";
import { Toaster } from "sonner";

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

  const session = await requireSessionWithTenant();
  // session.tenantId = tenant actif (cookie admin si présent) OU defaultTenantId
  const tenantId = String(session.tenantId ?? "")
    .trim()
    .toLowerCase();

  const isAdmin = isAdminRole(session.role);

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <ReactQueryProvider>
      <NextIntlClientProvider messages={messages}>
        <div className="flex h-dvh min-h-0 min-w-0">
          <AdminClientProviders tenantId={tenantId}>
            {/* AdminShell : protège les composants sensibles côté client (RHF, Radix Tabs, Dialog, useId, etc.). */}
            <AdminShell>
              {/* Colonne gauche */}
              <aside className="shrink-0">
                <AdminSidebar locale={locale} isAdmin={isAdmin} />
              </aside>

              {/* Colonne droite = tout le contenu “inset” */}
              <SidebarInset className="bg-sidebar flex flex-col min-w-0 min-h-0 h-full">
                {/* Header admin : navigation + skip-link. */}
                <Header />

                {/* Zone principale : contenu des pages tabs. */}
                <main
                  id="main"
                  className="flex-1 border border-primary/10 bg-background rounded-sm ml-2 md:ml-0 mb-2 mr-2 overflow-y-auto"
                  tabIndex={-1}
                >
                  <div className={cn(ADMIN_CONTAINER)}>
                    <div className={cn(ADMIN_PAGE)}>{children}</div>
                  </div>
                </main>

                {/* Toaster local admin. */}
                <Toaster />
              </SidebarInset>
            </AdminShell>
          </AdminClientProviders>
        </div>
      </NextIntlClientProvider>
    </ReactQueryProvider>
  );
}
