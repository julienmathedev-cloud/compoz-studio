/**
 * @file apps/studio/src/app/api/_adapters/footer.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for footer settings update intents.
 *
 * @remarks
 * - Normalizes the complete baseline and partial patch independently.
 * - Leaves state handling to the route.
 */

import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { FooterSettings } from "@compoz/core/domain/site/entities/footer";
import type { UpdateFooterSettingsInput } from "@compoz/core/domain/site/use-cases/footer/update-footer-settings.types";
import type { UpdateFooterSettingsIntentDTO } from "@compoz/validation/site/settings/footer/footer-intents";

export function adaptUpdateFooterIntent(
  dto: UpdateFooterSettingsIntentDTO,
): UpdateFooterSettingsInput {
  const started = Date.now();

  log.debug("studio.adapter.footer.patch.start", {
    expectedRevision: dto.expectedRevision,
    patchKeys: Object.keys(dto.patch),
  });

  const baseline: FooterSettings = {
    copyright: trimOrKeep(dto.baseline.copyright),
    showYear: dto.baseline.showYear,
  };
  const patch: Partial<FooterSettings> = {};

  if (typeof dto.patch.showYear === "boolean") {
    patch.showYear = dto.patch.showYear;
  }

  if (typeof dto.patch.copyright === "string") {
    // Empty string is allowed by design for this UX.
    patch.copyright = trimOrKeep(dto.patch.copyright);
  }

  log.debug("studio.adapter.footer.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return {
    baseline,
    patch,
    expectedRevision: dto.expectedRevision,
  };
}
