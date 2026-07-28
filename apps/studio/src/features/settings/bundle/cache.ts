/**
 * @file apps/studio/src/features/settings/bundle/cache.ts
 * @layer studio/features/settings/bundle
 *
 * @description
 * React Query cache helpers for revisioned Studio settings bundles.
 *
 * @remarks
 * - Keeps the canonical `{ settings, revisions }` projection under one query key.
 * - Updates the cached bundle after a slice PATCH without forcing a global invalidation.
 * - Ignores absent, legacy, or malformed cached values instead of fabricating an incomplete bundle.
 * - Studio cache keys are scoped by Prisma Website.id and content state.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettingsWithRevisionsDTO } from "@compoz/core/domain/site/dto";
import { isUnknownObject } from "@compoz/http/http-error";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

type SettingsBundlePatch = Readonly<{
  settings: Partial<SiteSettingsWithRevisionsDTO["settings"]>;
  revisions?: Partial<SiteSettingsWithRevisionsDTO["revisions"]>;
}>;

const SETTINGS_SECTION_KEYS = [
  "header",
  "footer",
  "primaryMenu",
  "legalMenu",
  "social",
  "identity",
  "seo",
  "theme",
] as const satisfies ReadonlyArray<
  keyof SiteSettingsWithRevisionsDTO["settings"]
>;

const SETTINGS_REVISION_KEYS = [
  "headerRevision",
  "footerRevision",
  "primaryMenuRevision",
  "legalMenuRevision",
  "socialRevision",
  "identityRevision",
  "seoRevision",
  "themeRevision",
] as const satisfies ReadonlyArray<
  keyof SiteSettingsWithRevisionsDTO["revisions"]
>;

function isNonArrayObject(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return isUnknownObject(value) && !Array.isArray(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/**
 * Validates the canonical Studio settings bundle cache projection.
 *
 * Section internals are validated at their HTTP and form boundaries. This guard
 * only verifies the complete bundle envelope required for safe cache merging.
 */
export function isSettingsBundle(
  value: unknown,
): value is SiteSettingsWithRevisionsDTO {
  if (!isNonArrayObject(value)) return false;

  const settings = value["settings"];
  const revisions = value["revisions"];

  if (!isNonArrayObject(settings) || !isNonArrayObject(revisions)) {
    return false;
  }

  for (const key of SETTINGS_SECTION_KEYS) {
    if (!isNonArrayObject(settings[key])) {
      return false;
    }
  }

  for (const key of SETTINGS_REVISION_KEYS) {
    if (!isNonNegativeSafeInteger(revisions[key])) {
      return false;
    }
  }

  return true;
}

export function patchSettingsBundleCache(
  queryClient: QueryClient,
  websiteId: string,
  state: ContentState,
  patch: SettingsBundlePatch,
): void {
  queryClient.setQueryData<unknown>(
    settingsBundleKey(websiteId, state),
    (previous: unknown) => {
      if (!isSettingsBundle(previous)) {
        return previous;
      }

      return {
        settings: {
          ...previous.settings,
          ...patch.settings,
        },
        revisions: {
          ...previous.revisions,
          ...(patch.revisions ?? {}),
        },
      } satisfies SiteSettingsWithRevisionsDTO;
    },
  );
}

patchSettingsBundleCache.displayName = "patchSettingsBundleCache";
