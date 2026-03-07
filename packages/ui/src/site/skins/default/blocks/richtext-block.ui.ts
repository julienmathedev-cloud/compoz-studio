/**
 * @file packages/ui/src/site/skins/default/blocks/richtext-block.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI pour le richtext site (thème Default).
 */

import type { SiteRichTextUi } from "@compoz/ui/site/site-ui.types";
import { SITE_PROSE } from "@compoz/ui/styles/site/typography";

export const defaultRichTextUi: SiteRichTextUi = {
  root: SITE_PROSE,
};
