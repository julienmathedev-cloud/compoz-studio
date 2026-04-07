/**
 * @file src/core/domain/site/use-cases/legal-menu/update-legal-menu-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.legalMenu`.
 * Charge les settings (draft/published), applique un merge shallow, valide les invariants
 * métier puis persiste uniquement si au moins une clé a changé.
 *
 * @remarks
 * Particularité : ce use-case exécute `assertLegalMenuSettings` avant persistance.
 * Une violation d’invariant lève une `DomainError`.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdateLegalMenuSettingsDeps,
  UpdateLegalMenuSettingsInput,
  UpdateLegalMenuSettingsResult,
} from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings.types";
import { assertLegalMenuSettings } from "@compoz/core/domain/site/validators/legal-menu";

export function updateLegalMenuSettings({ repo }: UpdateLegalMenuSettingsDeps) {
  return async function run(
    input: UpdateLegalMenuSettingsInput,
  ): Promise<UpdateLegalMenuSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: legalMenuNext, changedKeys } =
      shallowMergeWithChangedKeys<LegalMenuSettings>(current.legalMenu, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    // ✅ Invariants métier bloquants avant écriture (ids, unicité, champs requis, etc.).
    assertLegalMenuSettings(legalMenuNext);

    const next: SiteSettings = { ...current, legalMenu: legalMenuNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    // ✅ Domaine pur : aucune invalidation cache ici.
    return { settings: next };
  };
}
