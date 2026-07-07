/**
 * @file packages/core/src/domain/site/use-cases/theme/update-theme-settings.ts
 * @layer core/domain/site/use-cases/theme
 * @description Applies a shallow patch to theme settings.
 * @remarks
 * The patch is validated upstream; theme invariants are asserted before persistence.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { ThemeSettings } from "@compoz/core/domain/site/entities/theme";
import type {
  UpdateThemeSettingsDeps,
  UpdateThemeSettingsInput,
  UpdateThemeSettingsResult,
} from "@compoz/core/domain/site/use-cases/theme/update-theme-settings.types";
import { assertThemeSettings } from "@compoz/core/domain/site/validators/theme";

export function updateThemeSettings({ repo }: UpdateThemeSettingsDeps) {
  return async function run(
    input: UpdateThemeSettingsInput,
  ): Promise<UpdateThemeSettingsResult> {
    const patch: Partial<ThemeSettings> = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: themeNext, changedKeys } =
      shallowMergeWithChangedKeys<ThemeSettings>(current.theme, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    assertThemeSettings(themeNext);

    const next: SiteSettings = { ...current, theme: themeNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    return { settings: next };
  };
}
