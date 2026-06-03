/**
 * @file packages/ui/src/site/skins/lola/header.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — header site (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Compose les skins des sous-composants (logo, menu, social).
 * - Consommé par `SiteHeader` via la prop `ui`.
 */

import type { SiteHeaderUiOverride } from "@compoz/ui/site/site-ui.types";

import { lolaPrimaryMenuUi } from "@compoz/ui/site/skins/lola/primary-menu.ui";
import { lolaSocialMenuUi } from "@compoz/ui/site/skins/lola/social-menu.ui";

export const lolaHeaderUi: SiteHeaderUiOverride = {
  menu: lolaPrimaryMenuUi,
  social: lolaSocialMenuUi,
} as const;
