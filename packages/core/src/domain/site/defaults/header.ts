/**
 * @file packages/core/src/domain/site/defaults/header.ts
 * @layer core/domain/site
 * @description Business defaults for header settings.
 * @remarks
 * Static defaults only; no runtime logic belongs in this file.
 */

import type { HeaderSettings } from "@compoz/core/domain/site/entities/header";

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  showLogo: true,
  showSiteName: false,
  sticky: true,
  blur: false,
  swapPrimaryAndSocial: false,
};
