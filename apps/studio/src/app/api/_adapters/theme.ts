/**
 * @file apps/studio/src/app/api/_adapters/theme.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateur API Studio pour Theme :
 * convertit le DTO d’intention en input domaine pour le use-case.
 *
 * Responsabilités :
 * - trimming défensif des tokens couleur
 * - respect des champs optionnels
 * - aucune logique métier
 * - aucun handling de state (géré par la route)
 */

import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  PublicThemeTokens,
  ThemeSettings,
} from "@compoz/core/domain/site/entities/theme";
import type { UpdateThemeSettingsInput } from "@compoz/core/domain/site/use-cases/theme/update-theme-settings.types";
import type { UpdateThemeSettingsIntentDTO } from "@compoz/validation/site/settings/theme/theme-intents";

function adaptThemeTokensPatch(
  tokens: Partial<PublicThemeTokens> | undefined,
): Partial<PublicThemeTokens> | undefined {
  if (!tokens) return undefined;

  const patch: Partial<PublicThemeTokens> = {};

  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === "string") {
      patch[key as keyof PublicThemeTokens] = trimOrKeep(value);
    }
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

export function adaptUpdateThemeIntent(
  dto: UpdateThemeSettingsIntentDTO,
): UpdateThemeSettingsInput {
  const started = Date.now();

  log.debug("studio.adapter.theme.patch.start", {
    hasEnableDarkMode: typeof dto.enableDarkMode === "boolean",
    hasMode: typeof dto.mode === "string",
    hasFontFamily: typeof dto.fontFamily === "string",
    hasRevealPreset: typeof dto.revealPreset === "string",
    hasLightTokens: dto.lightTokens !== undefined,
    hasDarkTokens: dto.darkTokens !== undefined,
  });

  const patch: Partial<ThemeSettings> = {};

  if (typeof dto.enableDarkMode === "boolean") {
    patch.enableDarkMode = dto.enableDarkMode;
  }

  if (typeof dto.mode === "string") {
    patch.mode = dto.mode;
  }

  if (typeof dto.fontFamily === "string") {
    patch.fontFamily = dto.fontFamily;
  }

  if (typeof dto.revealPreset === "string") {
    patch.revealPreset = dto.revealPreset;
  }

  const lightTokensPatch = adaptThemeTokensPatch(dto.lightTokens);
  if (lightTokensPatch) {
    patch.lightTokens = lightTokensPatch as ThemeSettings["lightTokens"];
  }

  const darkTokensPatch = adaptThemeTokensPatch(dto.darkTokens);
  if (darkTokensPatch) {
    patch.darkTokens = darkTokensPatch as ThemeSettings["darkTokens"];
  }

  log.debug("studio.adapter.theme.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
