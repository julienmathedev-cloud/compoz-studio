/**
 * @file packages/core/src/domain/site/validators/theme.ts
 * @layer core/domain/site/validators
 * @description Blocking domain invariants for theme settings.
 * @remarks
 * Shape and base field validation are handled upstream by schemas and adapters.
 */

import { THEME_FONTS } from "@compoz/core/constants/theme/theme-fonts";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { ThemeSettings } from "@compoz/core/domain/site/entities/theme";

function assertSupportedThemeFont(
  fontFamily: ThemeSettings["fontFamily"],
  path: readonly string[] = ["theme", "fontFamily"],
): void {
  const exists = THEME_FONTS.some((font) => font.id === fontFamily);

  if (!exists) {
    throw new DomainError({
      code: EC.THEME_FONT_UNSUPPORTED,
      message: EC.THEME_FONT_UNSUPPORTED,
      details: {
        path,
        value: fontFamily,
      },
    });
  }
}

function assertThemeModeConsistency(theme: ThemeSettings): void {
  if (!theme.enableDarkMode && theme.mode === "dark") {
    throw new DomainError({
      code: EC.THEME_DARK_MODE_DISABLED,
      message: EC.THEME_DARK_MODE_DISABLED,
      details: {
        path: ["theme", "mode"],
        value: theme.mode,
        enableDarkMode: theme.enableDarkMode,
      },
    });
  }
}

export function assertThemeSettings(theme: ThemeSettings): void {
  assertSupportedThemeFont(theme.fontFamily);
  if (theme.headingFont !== null) {
    assertSupportedThemeFont(theme.headingFont, ["theme", "headingFont"]);
  }
  assertThemeModeConsistency(theme);
}
