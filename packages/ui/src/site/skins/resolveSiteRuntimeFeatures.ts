/**
 * @file packages/ui/src/site/skins/resolveSiteRuntimeFeatures.ts
 * @layer ui/site/skins
 *
 * @description
 * Resolves internal public site runtime features from the current website slug.
 *
 * @remarks
 * Runtime features are intentionally not editor-facing; the default feature set stays neutral unless a skin needs an explicit runtime behavior.
 */

export type SiteRuntimeFeatures = Readonly<{
  autoHideSingleH1Block: boolean;
}>;

const DEFAULT_SITE_RUNTIME_FEATURES: SiteRuntimeFeatures = {
  autoHideSingleH1Block: false,
} as const;

function normalizeWebsiteSlug(websiteSlug?: string): string {
  return String(websiteSlug ?? "")
    .trim()
    .toLowerCase();
}

export function resolveSiteRuntimeFeatures(
  websiteSlug?: string,
): SiteRuntimeFeatures {
  if (normalizeWebsiteSlug(websiteSlug) === "lola") {
    return {
      autoHideSingleH1Block: true,
    } as const;
  }

  return DEFAULT_SITE_RUNTIME_FEATURES;
}
