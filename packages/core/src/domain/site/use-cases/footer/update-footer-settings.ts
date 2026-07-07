/**
 * @file packages/core/src/domain/site/use-cases/footer/update-footer-settings.ts
 * @layer core/domain/site/use-cases/footer
 * @description Applies a shallow patch to footer settings.
 * @remarks
 * The patch is validated upstream; the use-case persists only when at least one key changes.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { FooterSettings } from "@compoz/core/domain/site/entities";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdateFooterSettingsDeps,
  UpdateFooterSettingsInput,
  UpdateFooterSettingsResult,
} from "@compoz/core/domain/site/use-cases/footer/update-footer-settings.types";
export function updateFooterSettings({ repo }: UpdateFooterSettingsDeps) {
  return async function run(
    input: UpdateFooterSettingsInput,
  ): Promise<UpdateFooterSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: footerNext, changedKeys } =
      shallowMergeWithChangedKeys<FooterSettings>(current.footer, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = { ...current, footer: footerNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    return { settings: next };
  };
}
