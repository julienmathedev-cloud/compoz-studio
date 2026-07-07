/**
 * @file packages/core/src/domain/site/use-cases/header/update-header-settings.ts
 * @layer core/domain/site/use-cases/header
 * @description Applies a shallow patch to header settings.
 * @remarks
 * The patch is validated upstream; the use-case persists only when at least one key changes.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { HeaderSettings } from "@compoz/core/domain/site/entities";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdateHeaderSettingsDeps,
  UpdateHeaderSettingsInput,
  UpdateHeaderSettingsResult,
} from "@compoz/core/domain/site/use-cases/header/update-header-settings.types";

export function updateHeaderSettings({ repo }: UpdateHeaderSettingsDeps) {
  return async function run(
    input: UpdateHeaderSettingsInput,
  ): Promise<UpdateHeaderSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: headerNext, changedKeys } =
      shallowMergeWithChangedKeys<HeaderSettings>(current.header, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = { ...current, header: headerNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    return { settings: next };
  };
}
