/**
 * @file packages/ui/src/site/skins/resolveSiteUi.ts
 * @module ui/site/skins
 *
 * @description
 * Résout le skin UI site à partir du tenant courant.
 *
 * @remarks
 * - `defaultGlobalUi` reste le socle commun.
 * - Chaque tenant peut fournir un override partiel.
 * - Si aucun skin dédié n’existe pour le tenant demandé,
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

/**
 * Table de correspondance tenant -> skin UI.
 */
const SITE_UI_BY_TENANT: Readonly<Record<string, SiteGlobalUiOverride>> = {
  demo: demoGlobalUi,
  lola: lolaGlobalUi,
  portfolio: portfolioGlobalUi,
};

function resolveSkinTenantId(tenantId?: string): string {
  const normalizedTenantId = String(tenantId ?? "")
    .trim()
    .toLowerCase();

  if (normalizedTenantId.startsWith("demo-")) {
    return "demo";
  }

  return normalizedTenantId;
}

/**
 * Résout l’UI site complète pour un tenant donné.
 *
 * @param tenantId - Identifiant canonique du tenant courant.
 * @returns UI complète fusionnée à partir du socle par défaut et, si présent,
 * du skin dédié au tenant.
 */
export function resolveSiteUi(tenantId?: string): SiteGlobalUi {
  const skinTenantId = resolveSkinTenantId(tenantId);

  const override = skinTenantId ? SITE_UI_BY_TENANT[skinTenantId] : undefined;

  return mergeSiteUi(defaultGlobalUi, override);
}
