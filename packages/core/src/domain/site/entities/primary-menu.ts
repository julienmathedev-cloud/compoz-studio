/**
 * @file packages/core/src/domain/site/entities/primary-menu.ts
 * @layer core/domain/site/entities
 * @description Canonical primary menu settings for a site.
 * @remarks
 * Menu depth and consistency are enforced by validation and the admin UI.
 */

import type { AssetUrl } from "@compoz/core/domain/urls/href";

export interface PrimaryMenuItem {
  id: string;
  label: string;
  href: AssetUrl;
  newTab: boolean;
  children: ReadonlyArray<PrimaryMenuItem>;
}

export interface PrimaryMenuSettings {
  items: ReadonlyArray<PrimaryMenuItem>;
}
