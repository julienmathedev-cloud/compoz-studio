/**
 * @file apps/studio/src/i18n/request.ts
 * @layer studio/i18n
 *
 * @description
 * Server-side next-intl request configuration for the Studio app.
 *
 * @remarks
 * - Resolves the active locale from the request and loads the matching JSON message bundle.
 * - Falls back to the configured default locale when `requestLocale` is unavailable.
 * - Unknown locales are rejected before loading messages.
 */

import { routing } from "@compoz/studio/i18n/routing";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

type Locale = (typeof routing.locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` can be undefined depending on the next-intl version.
  const maybeLocale = await requestLocale;
  const locale = (maybeLocale ?? routing.defaultLocale) as Locale;

  // Reject unknown locales before attempting to load their message bundle.
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
