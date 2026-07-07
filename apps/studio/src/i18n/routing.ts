/**
 * @file apps/studio/src/i18n/routing.ts
 * @layer studio/i18n
 *
 * @description
 * Studio i18n routing configuration.
 *
 * @remarks
 * - Source of truth for supported locales, the default locale, navigation helpers, and request message loading.
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});
