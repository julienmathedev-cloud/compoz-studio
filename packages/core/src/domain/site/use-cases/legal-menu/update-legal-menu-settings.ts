/**
 * @file src/core/domain/site/use-cases/legal-menu/update-legal-menu-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.legalMenu`.
 * Charge les settings (draft/published), applique un merge shallow, et persiste
 * uniquement si au moins une clé a changé.
 *
 * @remarks
 * - Le patch est validé/normalisé en amont (schemas/adapters).
 * - `repo.ensureBase()` prépare la persistance (pré-requis infra).
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdateLegalMenuSettingsDeps,
  UpdateLegalMenuSettingsInput,
  UpdateLegalMenuSettingsResult,
} from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings.types";

export function updateLegalMenuSettings({ repo }: UpdateLegalMenuSettingsDeps) {
  return async function run(
    input: UpdateLegalMenuSettingsInput,
  ): Promise<UpdateLegalMenuSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(WRITE_CONTENT_STATE);

    const { next: legalMenuNext, changedKeys } =
      shallowMergeWithChangedKeys<LegalMenuSettings>(current.legalMenu, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = { ...current, legalMenu: legalMenuNext };

    await repo.writeSettings(WRITE_CONTENT_STATE, next);

    // ✅ Domaine pur : aucune invalidation cache ici.
    return { settings: next };
  };
}
