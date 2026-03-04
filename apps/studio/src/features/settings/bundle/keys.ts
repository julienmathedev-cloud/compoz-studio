/**
 * @file apps/studio/src/features/settings/bundle/keys.ts
 * @layer hooks/admin/site/settings-bundle
 *
 * @description
 * Query keys pour le bundle de settings (read global).
 *
 * @remarks
 * - Tenant-scoped: inclut tenantId pour éviter collisions lors d’un switch tenant.
 * - Le bundle est la source de vérité READ côté admin (Option B).
 * - Les saves restent slice-by-slice (PATCH), puis patch du cache bundle.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

export const settingsBundleKey = (tenantId: string, state: ContentState) => {
  const tId = String(tenantId ?? "")
    .trim()
    .toLowerCase();
  return ["t", tId, "admin", "site", "settingsBundle", state] as const;
};
