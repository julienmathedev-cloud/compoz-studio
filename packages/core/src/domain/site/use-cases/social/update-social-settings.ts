/**
 * @file packages/core/src/domain/site/use-cases/social/update-social-settings.ts
 * @layer core/domain/site/use-cases/social
 * @description Applies a revisioned three-way merge to social settings.
 * @remarks The ordered items array is atomic and structurally compared; the merged result uses the business validator before CAS.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdateSocialSettingsDeps,
  UpdateSocialSettingsInput,
  UpdateSocialSettingsResult,
} from "@compoz/core/domain/site/use-cases/social/update-social-settings.types";
import { assertSocialSettings } from "@compoz/core/domain/site/validators/social";

const SOCIAL_FIELDS = ["items"] as const;
export function updateSocialSettings({ repo }: UpdateSocialSettingsDeps) {
  return (
    input: UpdateSocialSettingsInput,
  ): Promise<UpdateSocialSettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "social",
      fields: SOCIAL_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.social,
          revision: bundle.revisions.socialRevision,
        };
      },
      compareAndSet: (expectedRevision, social) =>
        repo.compareAndSetDraftSocial({
          expectedRevision,
          social,
        }),
      equals: (_field, left, right) => equalJsonValue(left, right),
      validate: assertSocialSettings,
    });
}
