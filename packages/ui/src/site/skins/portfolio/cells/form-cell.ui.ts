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
  card: "w-full max-w-2xl mx-auto border border-border/80 bg-card/70 shadow-sm motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:border-primary/30",

  content: "flex flex-col gap-6 pb-4",

  footer: "flex justify-end border-t border-border/60 bg-transparent",

  submitButton: portfolioButtonClass + " w-fit cursor-pointer",
} as const;
