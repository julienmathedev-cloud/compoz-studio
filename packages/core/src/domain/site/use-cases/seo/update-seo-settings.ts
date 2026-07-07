/**
 * @file packages/core/src/domain/site/use-cases/seo/update-seo-settings.ts
 * @layer core/domain/site/use-cases/seo
 * @description Applies a shallow patch to SEO settings.
 * @remarks
 * The patch is validated upstream; blocking SEO invariants are asserted during publication.
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

    return { settings: next };
  };
}
