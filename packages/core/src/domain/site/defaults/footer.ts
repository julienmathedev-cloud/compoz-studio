/**
 * @file packages/core/src/domain/site/defaults/footer.ts
 * @layer core/domain/site
 * @description Business defaults for footer settings.
 * @remarks
 * Static defaults only; no runtime logic belongs in this file.
 */

import type { FooterSettings } from "@compoz/core/domain/site/entities/footer";

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  copyright: "Compoz",
  showYear: true,
};
