/**
 * @file packages/core/src/domain/site/defaults/primary-menu.ts
 * @layer core/domain/site/defaults
 * @description Default primary menu settings.
 * @remarks
 * Keep this file declarative: menu entries are created through the admin UI.
 */

import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";

export const DEFAULT_PRIMARY_MENU_SETTINGS: PrimaryMenuSettings = {
  items: [],
};
