/**
 * @file packages/core/src/domain/site/use-cases/footer/update-footer-settings.ts
 * @layer core/domain/site/use-cases/footer
 * @description Merges and conditionally persists a revisioned footer update.
 * @remarks
 * The patch is validated upstream and retried at most three times after lost CAS races.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { compareThreeWayField } from "@compoz/core/domain/revisions/three-way-field";
import type { FooterSettings } from "@compoz/core/domain/site/entities";
import type {
  UpdateFooterSettingsDeps,
  UpdateFooterSettingsInput,
  UpdateFooterSettingsResult,
} from "@compoz/core/domain/site/use-cases/footer/update-footer-settings.types";

const MAX_CAS_ATTEMPTS = 3;
const FOOTER_FIELDS = ["copyright", "showYear"] as const;

export function updateFooterSettings({ repo }: UpdateFooterSettingsDeps) {
  return async function run(
    input: UpdateFooterSettingsInput,
  ): Promise<UpdateFooterSettingsResult> {
    if (input.expectedRevision === undefined) {
      throw new DomainError({ code: ERROR_CODES.REVISION_REQUIRED });
    }

    await repo.ensureBase();

    const local: FooterSettings = {
      ...input.baseline,
      ...input.patch,
    };

    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
      const currentBundle =
        await repo.readSettingsWithRevisions(DEFAULT_CONTENT_STATE);
      const currentFooter = currentBundle.settings.footer;
      const currentRevision = currentBundle.revisions.footerRevision;
      const mergedFooter: FooterSettings = { ...currentFooter };
      const conflictingPaths: Array<(typeof FOOTER_FIELDS)[number]> = [];

      for (const field of FOOTER_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(input.patch, field)) continue;

        const comparison = compareThreeWayField({
          path: field,
          baseline: input.baseline[field],
          current: currentFooter[field],
          local: local[field],
        });

        if (comparison.classification === "conflict") {
          conflictingPaths.push(field);
        } else if (comparison.classification === "local-only") {
          Object.assign(mergedFooter, { [field]: local[field] });
        }
      }

      if (conflictingPaths.length > 0) {
        throw new DomainError({
          code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
          details: {
            resourceId: "footer",
            expectedRevision: input.expectedRevision,
            currentRevision,
            conflictingPaths,
          },
        });
      }

      if (
        mergedFooter.copyright === currentFooter.copyright &&
        mergedFooter.showYear === currentFooter.showYear
      ) {
        return { settings: currentFooter, revision: currentRevision };
      }

      const persisted = await repo.compareAndSetDraftFooter({
        expectedRevision: currentRevision,
        footer: mergedFooter,
      });

      if (persisted) return persisted;
    }

    throw new DomainError({ code: ERROR_CODES.CONFLICT });
  };
}
