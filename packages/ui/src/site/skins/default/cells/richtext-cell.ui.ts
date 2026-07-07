/**
 * @file packages/ui/src/site/skins/default/cells/richtext-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for rich text cells.
 */

import type { SiteRichTextUi } from "@compoz/ui/site/site-ui.types";
import { SITE_PROSE } from "@compoz/ui/styles/site/typography";

export const defaultRichTextUi: SiteRichTextUi = {
  root: SITE_PROSE,
};
