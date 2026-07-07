/**
 * @file packages/ui/src/settings/mappers/theme-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Maps theme settings DTOs to stable runtime theme settings shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * API intents and form-oriented normalization stay outside this boundary mapper; this mapper only applies stable runtime defaults.
 */

import { getThemeFontById } from "@compoz/core/constants/theme/theme-fonts";
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
  const fontFamily =
    getThemeFontById(dto?.fontFamily)?.id ?? DEFAULT_THEME_FONT_ID;
  const headingFont = getThemeFontById(dto?.headingFont)?.id ?? null;

  return {
    enableDarkMode:
      typeof dto?.enableDarkMode === "boolean" ? dto.enableDarkMode : false,

    mode: dto?.mode ?? "light",

    fontFamily,

    headingFont,

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
