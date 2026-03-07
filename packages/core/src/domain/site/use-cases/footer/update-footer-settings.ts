/**
 * @file packages/core/src/domain/site/use-cases/footer/update-footer-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.footer`.
 * Charge les settings (draft/published), applique un merge shallow, et persiste
 * uniquement si au moins une clé a changé.
 *
 * @remarks
 * - Le patch est validé en amont (schemas/adapters).
 * - `repo.ensureBase()` prépare la persistance (pré-requis infra).
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

    // ✅ Domaine pur : aucune invalidation cache ici.
    return { settings: next };
  };
}
