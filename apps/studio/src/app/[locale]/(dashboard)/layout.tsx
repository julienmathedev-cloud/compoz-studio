/**
 * @file apps/studio/src/app/[locale]/(dashboard)/layout.tsx
 * @layer studio/app
 *
 * @description
 * Layout localisé i18n du Dashboard Studio.
 *
 * @remarks
 * - Initialise la locale (`setRequestLocale`).
 * - Fournit `NextIntlClientProvider`.
 * - Résout la session Studio et le Website actif côté server.
 * - Monte les providers client globaux (React Query, thème, sidebar, toasts, etc.).
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
  getSessionWithWebsiteOrNull,
  isAdminRole,
  isStaleWebsiteSessionError,
} from "@compoz/studio/auth/require-session";
import { StudioSidebar } from "@compoz/studio/components/organisms/StudioSidebar";
import { Header } from "@compoz/studio/features/shell/components/Header";
import { StudioShell } from "@compoz/studio/features/shell/components/StudioShell";
import { routing } from "@compoz/studio/i18n/routing";
import { ReactQueryProvider } from "@compoz/studio/lib/react-query/ReactQueryProvider";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { SidebarInset, SidebarTrigger } from "@compoz/ui/components/ui/sidebar";
import { TooltipProvider } from "@compoz/ui/components/ui/tooltip";
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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

function normalizeWebsiteId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeWebsiteSlug(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeWebsiteName(value: unknown): string | undefined {
  const websiteName = String(value ?? "").trim();

  return websiteName ? websiteName : undefined;
}

/* -------------------------------------------------------------------------- */
/* Static params                                                              */
/* -------------------------------------------------------------------------- */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

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

  const session = await getSessionWithWebsiteOrNull().catch(
    (error: unknown) => {
      if (isStaleWebsiteSessionError(error)) {
        redirect("/api/auth/reset-stale-session");
      }

      throw error;
    },
  );

  if (!session) {
    const nextPath = `/${locale}`;

    redirect(`/${locale}/signin?next=${encodeURIComponent(nextPath)}`);
  }

  const websiteId = normalizeWebsiteId(session.websiteId);
  const websiteSlug = normalizeWebsiteSlug(session.websiteSlug);
  const websiteName = normalizeWebsiteName(session.websiteName);

  if (!websiteId || !websiteSlug) {
    notFound();
  }

  const isAdmin = isAdminRole(session.role);

  return (
    <ReactQueryProvider>
      <NextIntlClientProvider messages={messages}>
        <div className="flex h-dvh min-h-0 min-w-0">
          <TooltipProvider delayDuration={400} skipDelayDuration={100}>
            <StudioClientProviders
              websiteId={websiteId}
              websiteSlug={websiteSlug}
              websiteName={websiteName}
            >
              <StudioShell>
                <aside className="shrink-0">
                  <StudioSidebar locale={locale} isAdmin={isAdmin} />
                </aside>

                <SidebarInset className="flex min-h-0 min-w-0 h-full flex-col bg-sidebar">
                  <Header leftSlot={<SidebarTrigger visualMode="studio" />} />

                  <div
                    id="main"
                    className="ml-2 mr-2 mb-2 flex-1 overflow-y-auto rounded-sm border border-primary/10 bg-background md:ml-0"
                    tabIndex={-1}
                  >
                    <div className={cn(STUDIO_CONTAINER)}>
                      <div className={cn(STUDIO_PAGE)}>{children}</div>
                    </div>
                  </div>

                  <Toaster position="top-center" />
                </SidebarInset>
              </StudioShell>
            </StudioClientProviders>
          </TooltipProvider>
        </div>
      </NextIntlClientProvider>
    </ReactQueryProvider>
  );
}
