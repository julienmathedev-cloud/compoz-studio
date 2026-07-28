/**
 * @file packages/core/src/domain/site/use-cases/legal-menu/update-legal-menu-settings.ts
 * @layer core/domain/site/use-cases/legal-menu
 * @description Applies a revisioned three-way merge to legal-menu settings.
 * @remarks The items array is atomic and structurally compared; the merged result uses the business validator before CAS.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdateLegalMenuSettingsDeps,
  UpdateLegalMenuSettingsInput,
  UpdateLegalMenuSettingsResult,
} from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings.types";
import { assertLegalMenuSettings } from "@compoz/core/domain/site/validators/legal-menu";

const LEGAL_MENU_FIELDS = ["items"] as const;
export function updateLegalMenuSettings({ repo }: UpdateLegalMenuSettingsDeps) {
  return (
    input: UpdateLegalMenuSettingsInput,
  ): Promise<UpdateLegalMenuSettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "legalMenu",
      fields: LEGAL_MENU_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.legalMenu,
          revision: bundle.revisions.legalMenuRevision,
        };
      },
      compareAndSet: (expectedRevision, legalMenu) =>
        repo.compareAndSetDraftLegalMenu({
          expectedRevision,
          legalMenu,
        }),
      equals: (_field, left, right) => equalJsonValue(left, right),
      validate: assertLegalMenuSettings,
    });
}
