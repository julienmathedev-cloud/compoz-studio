/**
 * @file packages/core/src/domain/site/validators/theme.ts
 * @layer core/domain
 * @description
 * Validateur métier — invariants Theme bloquants.
 *
 * @remarks
 * Suppose que la shape de base (types, présence des champs)
 * est validée en amont par les schemas/adapters.
 *
 * Ce module se concentre uniquement sur les invariants stricts du domaine :
 * - `fontFamily` doit référencer une police supportée
 * - `mode="dark"` interdit si `enableDarkMode=false`
 */

import { THEME_FONTS } from "@compoz/core/constants/theme/theme-fonts";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { ThemeSettings } from "@compoz/core/domain/site/entities/theme";

/**
 * Vérifie qu’un identifiant de police est supporté par la source de vérité.
 *
 * @throws DomainError
 * - `EC.THEME_FONT_UNSUPPORTED`
 */
function assertSupportedThemeFont(
  fontFamily: ThemeSettings["fontFamily"],
): void {
  const exists = THEME_FONTS.some((font) => font.id === fontFamily);

  if (!exists) {
    throw new DomainError({
      code: EC.THEME_FONT_UNSUPPORTED,
      message: EC.THEME_FONT_UNSUPPORTED,
      details: {
        path: ["theme", "fontFamily"],
        value: fontFamily,
      },
    });
  }
}

/**
 * Vérifie la cohérence du mode sombre.
 *
 * @throws DomainError
 * - `EC.THEME_DARK_MODE_DISABLED`
 */
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

/**
 * Invariants globaux du thème public.
 *
 * @throws DomainError
 * - `EC.THEME_FONT_UNSUPPORTED`
 * - `EC.THEME_DARK_MODE_DISABLED`
 */
export function assertThemeSettings(theme: ThemeSettings): void {
  assertSupportedThemeFont(theme.fontFamily);
  assertThemeModeConsistency(theme);
}
