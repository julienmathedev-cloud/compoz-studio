/**
 * @file apps/studio/src/app/[locale]/signin/page.tsx
 * @layer studio/app
 *
 * @description
 * Server-side Studio sign-in page.
 *
 * @remarks
 * - Sanitizes the `next` URL parameter before passing it to the client form.
 * - Loads i18n messages server-side through `next-intl`.
 */

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SignInForm } from "@compoz/studio/auth/SignInForm";
import { routing } from "@compoz/studio/i18n/routing";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type Locale = (typeof routing.locales)[number];

type LocaleSignInPageProps = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
    }>
  >;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

function sanitizeNextPath(nextRaw: unknown): string {
  const raw =
    typeof nextRaw === "string"
      ? nextRaw
      : Array.isArray(nextRaw)
        ? (nextRaw[0] ?? "")
        : "";

  const n = raw.trim();
  if (!n) return "/";
  if (!n.startsWith("/")) return "/";
  // Basic defense against //evil.com.
  if (n.startsWith("//")) return "/";
  return n;
}

function hasStaleSessionError(errorRaw: unknown): boolean {
  const error =
    typeof errorRaw === "string"
      ? errorRaw
      : Array.isArray(errorRaw)
        ? (errorRaw[0] ?? "")
        : "";

  return error.trim() === "stale-session";
}

export default async function SignInPage({
  params,
  searchParams,
}: LocaleSignInPageProps) {
  const { locale } = await unwrapParams(params);

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  const sp = (await searchParams) ?? {};
  const nextPath = sanitizeNextPath(sp["next"]);
  const staleSession = hasStaleSessionError(sp["error"]);

  return (
    <NextIntlClientProvider messages={messages}>
      <SignInForm
        locale={locale}
        nextPath={nextPath}
        staleSession={staleSession}
      />
    </NextIntlClientProvider>
  );
}
