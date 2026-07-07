/**
 * @file packages/core/src/domain/site/entities/legal-menu.ts
 * @layer core/domain/site/entities
 * @description Canonical legal menu settings for a site.
 */

import type { AssetUrl } from "@compoz/core/domain/urls/href";

export interface LegalMenuItem {
  id: string;
  label: string;
  href: AssetUrl;
  newTab: boolean;
}

export interface LegalMenuSettings {
  items: ReadonlyArray<LegalMenuItem>;
}
