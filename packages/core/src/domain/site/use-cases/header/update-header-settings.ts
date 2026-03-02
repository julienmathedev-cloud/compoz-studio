/**
 * @file packages/core/src/domain/site/use-cases/header/update-header-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.header`.
 * Charge les settings (draft/published), applique un merge shallow, et persiste
 * uniquement si au moins une clé a changé.
 *
 * @remarks
 * - Le patch est validé en amont (schemas/adapters).
 * - `repo.ensureBase()` prépare la persistance (pré-requis infra).
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
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

    const current = await repo.readSettings(WRITE_CONTENT_STATE);

    const { next: headerNext, changedKeys } =
      shallowMergeWithChangedKeys<HeaderSettings>(current.header, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = { ...current, header: headerNext };

    await repo.writeSettings(WRITE_CONTENT_STATE, next);

    // ✅ Domaine pur : aucune invalidation cache ici.
    return { settings: next };
  };
}
