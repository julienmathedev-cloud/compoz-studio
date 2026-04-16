/**
 * @file packages/ui/src/site/skins/lola/system-page.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — "system page" site (thème Lola).
 *
 * @remarks
 * - Base commune utilisée pour `errorPage` et `notFoundPage`.
 * - Si besoin de différencier plus tard : faire un spread + override ciblé.
 */

import type { SiteSystemPageUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaSystemPageUi: SiteSystemPageUiOverride = {} as const;
