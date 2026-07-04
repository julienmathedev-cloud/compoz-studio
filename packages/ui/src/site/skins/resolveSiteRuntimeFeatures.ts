/**
 * @file packages/ui/src/site/skins/resolveSiteRuntimeFeatures.ts
 * @layer ui/site/skins
 *
 * @description
 * Résout les runtime features site à partir du `websiteSlug` courant.
 *
 * @remarks
 * - Socle neutre par défaut.
 * - Les features restent internes et non éditables.
 * - V0.1 : uniquement `autoHideSingleH1Block`.
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
