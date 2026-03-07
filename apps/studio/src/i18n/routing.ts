/**
 * @file apps/studio/src/i18n/routing.ts
 * @layer studio/i18n
 * @description
 * Configuration du routing i18n du Studio.
 *
 * Source de vérité pour :
 * - les locales supportées
 * - la locale par défaut
 * - la navigation i18n (`createNavigation`)
 * - le chargement des messages (`getRequestConfig`)
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});
