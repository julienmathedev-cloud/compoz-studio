/**
 * @file apps/studio/src/app/[locale]/(builder)/layout.tsx
 * @layer studio/app
 *
 * @description
 * Localized i18n layout for the Studio Builder.
 *
 * @remarks
 * - Initializes the locale with `setRequestLocale`.
 * - Mounts global providers: React Query, theme, sidebar, toasts, etc.
 * - Resolves the Studio session and active Website server-side.
 * - Intentionally stops at `StudioShell`.
 * - Builder visual composition (sidebar + header + main + drawer) is owned by
 *   `BuilderScreen` to keep a single shared RHF tree.
 */

import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Toaster } from "sonner";

import { StudioClientProviders } from "@compoz/studio/app/[locale]/StudioClientProviders";
import {
  getSessionWithWebsiteOrNull,
  isStaleWebsiteSessionError,
} from "@compoz/studio/auth/require-session";
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
