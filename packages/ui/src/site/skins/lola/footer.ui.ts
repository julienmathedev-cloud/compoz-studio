/**
 * @file packages/ui/src/site/skins/lola/footer.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — footer public (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `PublicFooter` via la prop `ui`.
 */

import type { PublicFooterUiOverride } from "@compoz/ui/site/public-ui.types";
import { lolaLegalMenuUi } from "@compoz/ui/site/skins/lola/legal-menu.ui";

export const lolaFooterUi: PublicFooterUiOverride = {
  // Surface full width (border + fond éventuel)
  footer: "w-full border-t border-zinc-100 bg-white/80",

  legalMenu: lolaLegalMenuUi,
} as const;
