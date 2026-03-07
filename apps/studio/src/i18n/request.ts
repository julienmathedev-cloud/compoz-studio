/**
 * @file apps/studio/src/i18n/request.ts
 * @layer studio/i18n
 * @description
 * Configuration `next-intl` côté serveur : sélection de la locale,
 * exécution des guards (dev/test) et chargement des messages JSON par locale.
 */

import { routing } from "@compoz/studio/i18n/routing";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

type Locale = (typeof routing.locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` peut être `undefined` selon la version de next-intl.
  // On applique un fallback robuste sur la locale par défaut.
  const maybeLocale = await requestLocale;
  const locale = (maybeLocale ?? routing.defaultLocale) as Locale;

  // Sécurité: locale invalide → 404 (et on évite de charger des messages inconnus)
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
