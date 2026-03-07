/**
 * @file packages/core/src/domain/site/use-cases/social/update-social-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.social`.
 * Charge les settings (draft/published), applique un merge shallow, valide les invariants
 * métier puis persiste uniquement si au moins une clé a changé.
 *
 * @remarks
 * Particularité : ce use-case exécute `assertSocialSettings` avant persistance.
 * Une violation d’invariant lève une `DomainError`.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SocialSettings } from "@compoz/core/domain/site/entities/social";
import type {
  UpdateSocialSettingsDeps,
  UpdateSocialSettingsInput,
  UpdateSocialSettingsResult,
} from "@compoz/core/domain/site/use-cases/social/update-social-settings.types";
import { assertSocialSettings } from "@compoz/core/domain/site/validators/social";

/**
 * Fabrique du use-case `updateSocialSettings`.
 * Le repository est injecté pour respecter la séparation domaine/infra.
 */
export function updateSocialSettings({ repo }: UpdateSocialSettingsDeps) {
  return async function run(
    input: UpdateSocialSettingsInput,
  ): Promise<UpdateSocialSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: socialNext, changedKeys } =
      shallowMergeWithChangedKeys<SocialSettings>(current.social, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    // ✅ Invariants métier bloquants avant écriture (unicité, formats, etc.).
    assertSocialSettings(socialNext);

    const next: SiteSettings = { ...current, social: socialNext };
    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    // ✅ Domaine pur : aucune invalidation cache ici.
    return { settings: next };
  };
}
