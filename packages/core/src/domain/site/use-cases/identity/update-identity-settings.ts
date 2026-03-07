/**
 * @file packages/core/src/domain/site/use-cases/identity/update-identity-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.identity`.
 * Charge les settings (draft/published), applique un merge shallow, et persiste
 * uniquement si au moins une clé a changé.
 *
 * @remarks
 * - Le patch est validé/normalisé en amont (schemas/adapters).
 * - `repo.ensureBase()` prépare la persistance (pré-requis infra).
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdateIdentitySettingsDeps,
  UpdateIdentitySettingsInput,
  UpdateIdentitySettingsResult,
} from "@compoz/core/domain/site/use-cases/identity/update-identity-settings.types";

export function updateIdentitySettings({ repo }: UpdateIdentitySettingsDeps) {
  return async function run(
    input: UpdateIdentitySettingsInput,
  ): Promise<UpdateIdentitySettingsResult> {
    const patch: Partial<IdentitySettings> = input.patch ?? {};

    // Invariant métier : si le logo est supprimé, on vide `logoAlt`.
    if ("logoUrl" in patch && patch.logoUrl == null) {
      patch.logoAlt = "";
    }

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: identityNext, changedKeys } =
      shallowMergeWithChangedKeys<IdentitySettings>(current.identity, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = { ...current, identity: identityNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);
    return { settings: next };
  };
}
