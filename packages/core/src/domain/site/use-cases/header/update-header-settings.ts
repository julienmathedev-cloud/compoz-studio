/**
 * @file packages/core/src/domain/site/use-cases/header/update-header-settings.ts
 * @layer core/domain/site/use-cases/header
 * @description Applies a revisioned, field-level three-way merge to header settings.
 * @remarks Header scalar fields are persisted with bounded retry through the header CAS primitive.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdateHeaderSettingsDeps,
  UpdateHeaderSettingsInput,
  UpdateHeaderSettingsResult,
} from "@compoz/core/domain/site/use-cases/header/update-header-settings.types";

const HEADER_FIELDS = [
  "showLogo",
  "showSiteName",
  "sticky",
  "blur",
  "swapPrimaryAndSocial",
] as const;

export function updateHeaderSettings({ repo }: UpdateHeaderSettingsDeps) {
  return (
    input: UpdateHeaderSettingsInput,
  ): Promise<UpdateHeaderSettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "header",
      fields: HEADER_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.header,
          revision: bundle.revisions.headerRevision,
        };
      },
      compareAndSet: (expectedRevision, header) =>
        repo.compareAndSetDraftHeader({
          expectedRevision,
          header,
        }),
    });
}
