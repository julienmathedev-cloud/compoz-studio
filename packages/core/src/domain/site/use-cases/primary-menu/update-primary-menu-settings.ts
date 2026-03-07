/**
 * @file packages/core/src/domain/site/use-cases/primary-menu/update-primary-menu-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.primaryMenu`.
 * Charge les settings (draft/published), applique un merge shallow, et persiste
 * uniquement si au moins une clé a changé.
 *
 * @remarks
 * - Le patch est validé/normalisé en amont (schemas/adapters).
 * - `repo.ensureBase()` prépare la persistance (pré-requis infra).
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdatePrimaryMenuSettingsDeps,
  UpdatePrimaryMenuSettingsInput,
  UpdatePrimaryMenuSettingsResult,
} from "@compoz/core/domain/site/use-cases/primary-menu/update-primary-menu-settings.types";

/**
 * Fabrique du use-case `updatePrimaryMenuSettings`.
 */
export function updatePrimaryMenuSettings({
  repo,
}: UpdatePrimaryMenuSettingsDeps) {
  return async function run(
    input: UpdatePrimaryMenuSettingsInput,
  ): Promise<UpdatePrimaryMenuSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: menuNext, changedKeys } =
      shallowMergeWithChangedKeys<PrimaryMenuSettings>(
        current.primaryMenu,
        patch,
      );

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = { ...current, primaryMenu: menuNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    // ✅ Domaine pur : aucune invalidation cache ici.
    return { settings: next };
  };
}
