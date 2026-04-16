/**
 * @file packages/ui/src/site/skins/portfolio/cells/form-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — form cell (thème Portfolio).
 *
 * @remarks
 * Définit uniquement les styles Tailwind.
 * Aucune logique ici : le renderer gère les champs et l’envoi.
 */

import type { SiteFormUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioButtonClass } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";

export const portfolioFormUi: SiteFormUiOverride = {
  submitButton: portfolioButtonClass,
} as const;
