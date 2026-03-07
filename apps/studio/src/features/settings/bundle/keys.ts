/**
 * @file apps/studio/src/features/settings/bundle/keys.ts
 * @layer hooks/studio/site/settings-bundle
 *
 * @description
 * Query keys pour le bundle de settings (read global).
 *
 * @remarks
 * - Tenant-scoped: inclut tenantId pour éviter collisions lors d’un switch tenant.
 * - Le bundle est la source de vérité READ côté studio (Option B).
 * - Les saves restent slice-by-slice (PATCH), puis patch du cache bundle.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { toTenantId } from "@compoz/ui/lib/tenant-id";

export const settingsBundleKey = (tenantId: string, state: ContentState) => {
  const tid = toTenantId(tenantId);

  return ["t", tid, "studio", "site", "settingsBundle", state] as const;
};

settingsBundleKey.displayName = "settingsBundleKey";
