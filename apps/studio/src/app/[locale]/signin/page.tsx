/**
 * @file apps/studio/src/app/[locale]/signin/page.tsx
 * @layer studio/app
 * @description
 * Page de connexion Studio (Server) :
 * - Résout la locale (segment `[locale]`)
 * - Sanitize `next` depuis l’URL
 * - Rend le formulaire client
 *
 * @remarks
 * - Les messages i18n sont chargés via `next-intl` côté server.
 */

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { SignInForm } from "@compoz/studio/auth/SignInForm";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type LocaleSignInPageProps = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
    }>
  >;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

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
  // défense simple contre //evil.com
  if (n.startsWith("//")) return "/";
  return n;
}

export default async function SignInPage({
  params,
  searchParams,
}: LocaleSignInPageProps) {
  const { locale } = await unwrapParams(params);
  const messages = await getMessages();

  const sp = (await searchParams) ?? {};
  const nextPath = sanitizeNextPath(sp["next"]);

  return (
    <NextIntlClientProvider messages={messages}>
      <SignInForm locale={locale} nextPath={nextPath} />
    </NextIntlClientProvider>
  );
}
