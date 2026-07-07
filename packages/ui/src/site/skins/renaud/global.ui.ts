/**
 * @file packages/ui/src/site/skins/renaud/global.ui.ts
 * @layer ui/site/skins/renaud
 *
 * @description
 * Composes the Renaud public site skin overrides from layout and cell UI class maps.
 */

import type { SiteGlobalUiOverride } from "@compoz/ui/site/site-ui.types";
import { renaudBlockSectionUi } from "@compoz/ui/site/skins/renaud/block-section.ui";
import { renaudCardUi } from "@compoz/ui/site/skins/renaud/cells/card-cell.ui";
import { renaudFormUi } from "@compoz/ui/site/skins/renaud/cells/form-cell.ui";
import { renaudHeadingUi } from "@compoz/ui/site/skins/renaud/cells/heading-cell.ui";
import { renaudImageUi } from "@compoz/ui/site/skins/renaud/cells/image-cell.ui";
import { renaudRichTextUi } from "@compoz/ui/site/skins/renaud/cells/richtext-cell.ui";
import { renaudHeaderUi } from "@compoz/ui/site/skins/renaud/header.ui";

export const renaudGlobalUi: SiteGlobalUiOverride = {
  header: renaudHeaderUi,
  cells: {
    card: renaudCardUi,
    form: renaudFormUi,
    heading: renaudHeadingUi,
    richText: renaudRichTextUi,
    image: renaudImageUi,
  },
  blockSection: renaudBlockSectionUi,
} as const;
