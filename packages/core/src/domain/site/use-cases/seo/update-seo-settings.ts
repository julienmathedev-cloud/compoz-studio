/**
 * @file packages/core/src/domain/site/use-cases/seo/update-seo-settings.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour partielle (shallow patch) des réglages `settings.seo`.
 * Charge les settings (draft/published), applique un merge shallow, et persiste
 * uniquement si au moins une clé a changé.
 *
 * @remarks
 * - Le patch est validé/normalisé en amont (schemas/adapters).
 * - La validation métier avancée est effectuée lors de la publication (`publishSite`).
 * - `repo.ensureBase()` prépare la persistance (pré-requis infra).
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { shallowMergeWithChangedKeys } from "@compoz/core/domain/site/_shared/merge";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type {
  UpdateSeoSettingsDeps,
  UpdateSeoSettingsInput,
  UpdateSeoSettingsResult,
} from "@compoz/core/domain/site/use-cases/seo/update-seo-settings.types";

/**
 * Fabrique du use-case `updateSeoSettings`.
 * Le repository est injecté pour faciliter les tests et l’inversion de dépendances.
 */
export function updateSeoSettings({ repo }: UpdateSeoSettingsDeps) {
  return async function run(
    input: UpdateSeoSettingsInput,
  ): Promise<UpdateSeoSettingsResult> {
    const patch = input.patch ?? {};

    await repo.ensureBase();

    const current = await repo.readSettings(DEFAULT_CONTENT_STATE);

    const { next: seoNext, changedKeys } =
      shallowMergeWithChangedKeys<SeoSettings>(current.seo, patch);

    if (changedKeys.length === 0) {
      return { settings: current };
    }

    const next: SiteSettings = { ...current, seo: seoNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    // ✅ Domaine pur : aucune invalidation cache ici.
    return { settings: next };
  };
}
