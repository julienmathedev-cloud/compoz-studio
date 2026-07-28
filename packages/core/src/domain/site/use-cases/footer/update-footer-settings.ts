/**
 * @file packages/core/src/domain/site/use-cases/footer/update-footer-settings.ts
 * @layer core/domain/site/use-cases/footer
 * @description Merges and conditionally persists a revisioned footer update.
 * @remarks
 * Uses a field-level three-way merge and revisioned compare-and-set. Scalar footer
 * values retain their native equality semantics.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdateFooterSettingsDeps,
  UpdateFooterSettingsInput,
  UpdateFooterSettingsResult,
} from "@compoz/core/domain/site/use-cases/footer/update-footer-settings.types";

const FOOTER_FIELDS = ["copyright", "showYear"] as const;

export function updateFooterSettings({ repo }: UpdateFooterSettingsDeps) {
  return (
    input: UpdateFooterSettingsInput,
  ): Promise<UpdateFooterSettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "footer",
      fields: FOOTER_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.footer,
          revision: bundle.revisions.footerRevision,
        };
      },
      compareAndSet: (expectedRevision, footer) =>
        repo.compareAndSetDraftFooter({
          expectedRevision,
          footer,
        }),
    });
}
