/**
 * @file apps/studio/src/app/[locale]/(builder)/layout.tsx
 * @layer studio/app
 *
 * @description
 * Layout localisé i18n du Builder Studio.
 *
 * @remarks
 * - Initialise la locale (`setRequestLocale`).
 * - Monte les providers globaux (React Query, thème, sidebar, toasts, etc.).
 * - Résout la session Studio et le Website actif côté server.
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
import { getSessionWithWebsiteOrNull } from "@compoz/studio/auth/require-session";
import { StudioShell } from "@compoz/studio/features/shell/components/StudioShell";
import { routing } from "@compoz/studio/i18n/routing";
import { ReactQueryProvider } from "@compoz/studio/lib/react-query/ReactQueryProvider";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { TooltipProvider } from "@compoz/ui/components/ui/tooltip";

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

  const session = await getSessionWithWebsiteOrNull();

  if (!session) {
    redirect(`/${locale}/signin?next=/${locale}`);
  }

  const websiteId = normalizeWebsiteId(session.websiteId);
  const websiteSlug = normalizeWebsiteSlug(session.websiteSlug);
  const websiteName = normalizeWebsiteName(session.websiteName);

  if (!websiteId || !websiteSlug) {
    notFound();
  }

  return (
    <ReactQueryProvider>
      <NextIntlClientProvider messages={messages}>
        <TooltipProvider delayDuration={400} skipDelayDuration={100}>
          <StudioClientProviders
            websiteId={websiteId}
            websiteSlug={websiteSlug}
            websiteName={websiteName}
            hasSidebar={false}
          >
            <main className="flex h-dvh min-h-0 min-w-0">
              <StudioShell>{children}</StudioShell>
            </main>

            <Toaster position="top-center" />
          </StudioClientProviders>
        </TooltipProvider>
      </NextIntlClientProvider>
    </ReactQueryProvider>
  );
}
