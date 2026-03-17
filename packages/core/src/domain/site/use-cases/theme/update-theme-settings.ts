/**
 * @file packages/core/src/domain/site/use-cases/theme/update-theme-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.theme`.
 * Charge les settings (draft/published), applique un merge shallow, valide
 * le résultat métier, et persiste uniquement si au moins une clé a changé.
 *
 * @remarks
 * - Le patch est validé/normalisé en amont (schemas/adapters).
 * - `repo.ensureBase()` prépare la persistance (pré-requis infra).
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
