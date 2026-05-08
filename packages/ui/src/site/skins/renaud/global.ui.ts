/**
 * @file packages/ui/src/site/skins/renaud/global.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — site (thème Renaud).
 *
 * @remarks
 * - Compose header/footer/systemPage.
 * - Fournit les valeurs minimales pour le renderer (container + H1 layout).
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import type { SiteGlobalUiOverride } from "@compoz/ui/site/site-ui.types";
import { renaudBlockSectionUi } from "@compoz/ui/site/skins/renaud/block-section.ui";
import { renaudHeadingUi } from "@compoz/ui/site/skins/renaud/cells/heading-cell.ui";
import { renaudRichTextUi } from "@compoz/ui/site/skins/renaud/cells/richtext-cell.ui";
import { renaudHeaderUi } from "@compoz/ui/site/skins/renaud/header.ui";
import { renaudFooterUi } from "@compoz/ui/site/skins/renaud/footer.ui";

export const renaudGlobalUi: SiteGlobalUiOverride = {
  header: renaudHeaderUi,
  footer: renaudFooterUi,
  cells: {
    heading: renaudHeadingUi,
    richText: renaudRichTextUi,
  },
  blockSection: renaudBlockSectionUi,
} as const;
