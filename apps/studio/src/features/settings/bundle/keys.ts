/**
 * @file apps/studio/src/features/settings/bundle/keys.ts
 * @layer hooks/studio/site/settings-bundle
 *
 * @description
 * Query keys pour le bundle de settings.
 *
 * @remarks
 * - Website-scoped : inclut Prisma Website.id pour éviter les collisions
 *   lors d’un switch Website.
 * - Le bundle est la source de vérité READ côté Studio.
 * - Les saves restent slice-by-slice via PATCH, puis patch du cache bundle.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

export const settingsBundleKey = (websiteId: string, state: ContentState) => {
  const websiteIdKey = String(websiteId ?? "").trim();

  return [
    "w",
    websiteIdKey,
    "studio",
    "site",
    "settingsBundle",
    state,
  ] as const;
};

settingsBundleKey.displayName = "settingsBundleKey";
