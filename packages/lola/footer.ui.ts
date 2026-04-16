/**
 * @file packages/ui/src/site/skins/lola/footer.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — footer site (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `SiteFooter` via la prop `ui`.
 */

import type { SiteFooterUiOverride } from "@compoz/ui/site/site-ui.types";
import { lolaLegalMenuUi } from "@compoz/ui/site/skins/lola/legal-menu.ui";

export const lolaFooterUi: SiteFooterUiOverride = {
  // Surface full width (border + fond éventuel)
  footer: "w-full border-t border-zinc-100 bg-white/80",

  legalMenu: lolaLegalMenuUi,
} as const;
