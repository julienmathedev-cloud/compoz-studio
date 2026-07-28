/**
 * @file packages/core/src/domain/site/use-cases/primary-menu/update-primary-menu-settings.ts
 * @layer core/domain/site/use-cases/primary-menu
 * @description Applies a revisioned three-way merge to primary-menu settings.
 * @remarks The items array is atomic and structurally compared; the merged result uses the business validator before CAS.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdatePrimaryMenuSettingsDeps,
  UpdatePrimaryMenuSettingsInput,
  UpdatePrimaryMenuSettingsResult,
} from "@compoz/core/domain/site/use-cases/primary-menu/update-primary-menu-settings.types";
import { assertPrimaryMenuSettings } from "@compoz/core/domain/site/validators/primary-menu";

const PRIMARY_MENU_FIELDS = ["items"] as const;
export function updatePrimaryMenuSettings({ repo }: UpdatePrimaryMenuSettingsDeps) {
  return (
    input: UpdatePrimaryMenuSettingsInput,
  ): Promise<UpdatePrimaryMenuSettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "primaryMenu",
      fields: PRIMARY_MENU_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.primaryMenu,
          revision: bundle.revisions.primaryMenuRevision,
        };
      },
      compareAndSet: (expectedRevision, primaryMenu) =>
        repo.compareAndSetDraftPrimaryMenu({
          expectedRevision,
          primaryMenu,
        }),
      equals: (_field, left, right) => equalJsonValue(left, right),
      validate: assertPrimaryMenuSettings,
    });
}
