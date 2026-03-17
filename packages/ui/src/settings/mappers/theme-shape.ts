/**
 * @file packages/ui/src/settings/mappers/theme-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Mapper "shared runtime" Theme :
 * - DTO domaine -> shape frontière stable (utilisée par site + studio preview)
 *
 * @remarks
 * - Ici : uniquement ce qui est utile au runtime (renderer/public/preview).
 * - Pas d’intents API ni de normalisation orientée formulaire.
 */

import {
  DEFAULT_DARK_THEME_TOKENS,
  DEFAULT_LIGHT_THEME_TOKENS,
  DEFAULT_THEME_FONT_ID,
} from "@compoz/core/domain/site/defaults/theme";
import type { ThemeSettingsDTO } from "@compoz/core/domain/site/dto";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

export function toThemeSettingsShapeFromDTO(
  dto: ThemeSettingsDTO | null | undefined,
): ThemeSettingsShape {
  return {
    enableDarkMode:
      typeof dto?.enableDarkMode === "boolean" ? dto.enableDarkMode : false,

    mode: dto?.mode ?? "light",

    fontFamily: dto?.fontFamily ?? DEFAULT_THEME_FONT_ID,

    revealPreset: dto?.revealPreset ?? "fade-up",

    lightTokens: {
      ...DEFAULT_LIGHT_THEME_TOKENS,
      ...dto?.lightTokens,
    },

    darkTokens: {
      ...DEFAULT_DARK_THEME_TOKENS,
      ...dto?.darkTokens,
    },
  };
}
