/**
 * @file packages/ui/src/site/skins/resolveSiteRuntimeFeatures.ts
 * @layer ui/site/skins
 *
 * @description
 * Résout les runtime features site à partir du tenant courant.
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

function normalizeTenantId(tenantId?: string): string {
  return String(tenantId ?? "")
    .trim()
    .toLowerCase();
}

export function resolveSiteRuntimeFeatures(
  tenantId?: string,
): SiteRuntimeFeatures {
  if (normalizeTenantId(tenantId) === "lola") {
    return {
      autoHideSingleH1Block: true,
    } as const;
  }

  return DEFAULT_SITE_RUNTIME_FEATURES;
}
