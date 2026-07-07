/**
 * @file packages/core/src/domain/site/use-cases/primary-menu/update-primary-menu-settings.ts
 * @layer core/domain/site/use-cases/primary-menu
 * @description Applies a shallow patch to primary menu settings.
 * @remarks
 * Primary menu invariants are asserted before persistence; violations raise a `DomainError`.
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
import { assertPrimaryMenuSettings } from "@compoz/core/domain/site/validators/primary-menu";

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

    // Blocking domain invariants before persistence.
    assertPrimaryMenuSettings(menuNext);

    const next: SiteSettings = { ...current, primaryMenu: menuNext };

    await repo.putSettings(DEFAULT_CONTENT_STATE, next);

    return { settings: next };
  };
}
