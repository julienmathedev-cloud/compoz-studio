/**
 * @file apps/studio/src/i18n/routing.ts
 * @layer i18n
 * @description
 * Configuration du routing i18n (locales, defaultLocale) — source de vérité pour la navigation et le chargement des messages.
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});
