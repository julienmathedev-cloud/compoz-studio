/**
 * @file packages/core/src/domain/site/use-cases/social/update-social-settings.ts
 * @layer core/domain/site/use-cases/social
 * @description Applies a shallow patch to social settings.
 * @remarks
 * Social link invariants are asserted before persistence; violations raise a `DomainError`.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SocialSettings } from "@compoz/core/domain/site/entities/social";
import type {
  UpdateSocialSettingsDeps,
  UpdateSocialSettingsInput,
  UpdateSocialSettingsResult,
} from "@compoz/core/domain/site/use-cases/social/update-social-settings.types";
import { assertSocialSettings } from "@compoz/core/domain/site/validators/social";

export function updateSocialSettings({ repo }: UpdateSocialSettingsDeps) {
  return async function run(
    input: UpdateSocialSettingsInput,
  ): Promise<UpdateSocialSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: socialNext, changedKeys } =
      shallowMergeWithChangedKeys<SocialSettings>(current.social, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    // Blocking domain invariants before persistence.
    assertSocialSettings(socialNext);

    const next: SiteSettings = { ...current, social: socialNext };
    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    return { settings: next };
  };
}
