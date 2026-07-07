/**
 * @file packages/ui/src/site/skins/resolveSiteUi.ts
 * @layer ui/site/skins
 *
 * @description
 * Resolves the public site UI skin from the current website slug.
 *
 * @remarks
 * The default skin is the common base; website-specific skins provide partial overrides selected by their public slug.
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

export function resolveSiteUi(websiteSlug?: string): SiteGlobalUi {
  const skinWebsiteSlug = resolveSkinWebsiteSlug(websiteSlug);

  const override = skinWebsiteSlug
    ? SITE_UI_BY_WEBSITE_SLUG[skinWebsiteSlug]
    : undefined;

  return mergeSiteUi(defaultGlobalUi, override);
}

export const SITE_SKIN_CSS_BY_WEBSITE_SLUG: Readonly<Record<string, string>> = {
  portfolio: "/site-skins/portfolio/custom.css",
  renaud: "/site-skins/renaud/custom.css",
} as const;

export function resolveSiteSkinCssHref(
  websiteSlug?: string,
): string | undefined {
  const skinWebsiteSlug = resolveSkinWebsiteSlug(websiteSlug);

  return SITE_SKIN_CSS_BY_WEBSITE_SLUG[skinWebsiteSlug];
}
