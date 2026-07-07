/**
 * @file apps/studio/src/features/settings/bundle/keys.ts
 * @layer studio/features/settings/bundle
 *
 * @description
 * React Query key factory for the Studio settings bundle.
 *
 * @remarks
 * - Keys are scoped by Prisma Website.id and content state to avoid cache collisions when switching Website.
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
