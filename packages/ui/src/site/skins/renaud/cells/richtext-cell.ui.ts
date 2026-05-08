/**

 * @file packages/ui/src/site/skins/renaud/cells/richtext-cell.ui.ts

 * @layer ui/site/skins

 *

 * @description

 * Override UI — richtext cell (site Meca A Dom 34).

 */

import type { SiteRichTextUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudRichTextUi: SiteRichTextUiOverride = {
  root: [
    "text-current",

    // Force les textes enrichis à suivre la couleur héritée de la section.

    "prose-p:text-current",

    "prose-li:text-current",

    "prose-strong:text-current",

    "prose-em:text-current",

    "prose-a:text-current",

    "prose-blockquote:text-current/85",

    // Si tes flèches sont dans des listes.

    "prose-li:marker:text-current",
  ].join(" "),
} as const;
