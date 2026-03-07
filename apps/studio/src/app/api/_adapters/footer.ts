/**
 * @file apps/studio/src/app/api/_adapters/footer.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateur API Studio pour le Footer :
 * convertit le DTO d’intention en input domaine pour le use-case.
 *
 * Responsabilités :
 * - trimming défensif (strings)
 * - respect des champs optionnels
 * - aucune logique métier
 * - aucun handling de state (géré par la route)
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
    // Chaîne vide autorisée (choix UX assumé)
    patch.copyright = trimOrKeep(dto.copyright);
  }

  log.debug("studio.adapter.footer.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
