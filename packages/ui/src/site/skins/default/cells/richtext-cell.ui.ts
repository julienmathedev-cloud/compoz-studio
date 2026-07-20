/**
 * @file packages/ui/src/site/skins/default/cells/richtext-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for rich text cells.
 */

import type { SiteRichTextUi } from "@compoz/ui/site/site-ui.types";
import { PROSE_CLASSNAME } from "@compoz/ui/styles/shared/typography";

export const defaultRichTextUi: SiteRichTextUi = {
  root: PROSE_CLASSNAME,
};
