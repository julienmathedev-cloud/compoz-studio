/**
 * @file packages/ui/src/site/skins/resolveSiteUi.ts
 * @module ui/site/skins
 *
 * @description
 * Résout le skin UI site à partir du `websiteSlug` courant.
 *
 * @remarks
 * - `defaultGlobalUi` reste le socle commun.
 * - Chaque Website peut fournir un override partiel via son slug public.
 * - Si aucun skin dédié n’existe pour le `websiteSlug` demandé,
 *   on retourne simplement le socle par défaut.
 */

import { mergeSiteUi } from "@compoz/ui/lib/mergeSiteUi";
import type {
  SiteGlobalUi,
  SiteGlobalUiOverride,
} from "@compoz/ui/site/site-ui.types";
import { defaultGlobalUi } from "@compoz/ui/site/skins/default/global.ui";
import { demoGlobalUi } from "@compoz/ui/site/skins/demo/global.ui";
import { lolaGlobalUi } from "@compoz/ui/site/skins/lola/global.ui";
import { portfolioGlobalUi } from "@compoz/ui/site/skins/portfolio/global.ui";
import { renaudGlobalUi } from "@compoz/ui/site/skins/renaud/global.ui";

/**
 * Table de correspondance websiteSlug -> skin UI.
 */
const SITE_UI_BY_WEBSITE_SLUG: Readonly<Record<string, SiteGlobalUiOverride>> =
  {
    demo: demoGlobalUi,
    lola: lolaGlobalUi,
    portfolio: portfolioGlobalUi,
    renaud: renaudGlobalUi,
  };

function resolveSkinWebsiteSlug(websiteSlug?: string): string {
  const normalizedWebsiteSlug = String(websiteSlug ?? "")
    .trim()
    .toLowerCase();

  if (normalizedWebsiteSlug.startsWith("demo-")) {
    return "demo";
  }

  return normalizedWebsiteSlug;
}

/**
 * Résout l’UI site complète pour un Website donné.
 *
 * @param websiteSlug - Slug public canonique du Website courant.
 * @returns UI complète fusionnée à partir du socle par défaut et, si présent,
 * du skin dédié au Website.
 */
export function resolveSiteUi(websiteSlug?: string): SiteGlobalUi {
  const skinWebsiteSlug = resolveSkinWebsiteSlug(websiteSlug);

  const override = skinWebsiteSlug
    ? SITE_UI_BY_WEBSITE_SLUG[skinWebsiteSlug]
    : undefined;

  return mergeSiteUi(defaultGlobalUi, override);
}

/**
 * Table de correspondance websiteSlug -> asset CSS de skin.
 */
export const SITE_SKIN_CSS_BY_WEBSITE_SLUG: Readonly<Record<string, string>> = {
  portfolio: "/site-skins/portfolio/custom.css",
  renaud: "/site-skins/renaud/custom.css",
} as const;

/**
 * Résout l’URL de l’asset CSS de skin pour un Website donné.
 *
 * @param websiteSlug - Slug public canonique du Website courant.
 * @returns URL de l’asset CSS de skin.
 */
export function resolveSiteSkinCssHref(
  websiteSlug?: string,
): string | undefined {
  const skinWebsiteSlug = resolveSkinWebsiteSlug(websiteSlug);

  return SITE_SKIN_CSS_BY_WEBSITE_SLUG[skinWebsiteSlug];
}
