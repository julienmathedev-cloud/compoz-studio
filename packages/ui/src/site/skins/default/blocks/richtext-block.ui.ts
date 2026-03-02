/**
 * @file packages/ui/src/site/skins/default/blocks/richtext-block.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI pour le richtext public (thème Default).
 */

import type { PublicRichTextUi } from "@compoz/ui/site/public-ui.types";
import { PUBLIC_PROSE } from "@compoz/ui/styles/site/typography";

export const defaultRichTextUi: PublicRichTextUi = {
  root: PUBLIC_PROSE,
};
