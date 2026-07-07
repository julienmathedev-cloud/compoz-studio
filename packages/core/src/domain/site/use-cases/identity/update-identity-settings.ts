/**
 * @file packages/core/src/domain/site/use-cases/identity/update-identity-settings.ts
 * @layer core/domain/site/use-cases/identity
 * @description Applies a shallow patch to identity settings.
 * @remarks
 * The patch is validated upstream; nested values such as `logo` are replaced as whole values.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdateIdentitySettingsDeps,
  UpdateIdentitySettingsInput,
  UpdateIdentitySettingsResult,
} from "@compoz/core/domain/site/use-cases/identity/update-identity-settings.types";

export function updateIdentitySettings({ repo }: UpdateIdentitySettingsDeps) {
  return async function run(
    input: UpdateIdentitySettingsInput,
  ): Promise<UpdateIdentitySettingsResult> {
    const patch: Partial<IdentitySettings> = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: identityNext, changedKeys } =
      shallowMergeWithChangedKeys<IdentitySettings>(current.identity, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = {
      ...current,
      identity: identityNext,
    };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    return { settings: next };
  };
}
