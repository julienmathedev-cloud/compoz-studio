/**
 * @file apps/studio/src/app/api/_adapters/footer.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for footer settings update intents.
 *
 * @remarks
 * - Builds a partial domain patch while preserving optional-field semantics.
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
    hasShowYear: typeof dto.showYear === "boolean",
    hasCopyright: typeof dto.copyright === "string",
    copyrightLen:
      typeof dto.copyright === "string" ? dto.copyright.length : undefined,
  });

  const patch: Partial<FooterSettings> = {};

  if (typeof dto.showYear === "boolean") {
    patch.showYear = dto.showYear;
  }

  if (typeof dto.copyright === "string") {
    // Empty string is allowed by design for this UX.
    patch.copyright = trimOrKeep(dto.copyright);
  }

  log.debug("studio.adapter.footer.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
