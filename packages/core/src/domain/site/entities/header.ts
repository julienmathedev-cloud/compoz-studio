/**
 * @file packages/core/src/domain/site/entities/header.ts
 * @layer core/domain/site/entities
 * @description Canonical header settings for a site.
 */

export interface HeaderSettings {
  showLogo: boolean;
  showSiteName: boolean;
  sticky: boolean;
  blur: boolean;
  swapPrimaryAndSocial: boolean;
}
