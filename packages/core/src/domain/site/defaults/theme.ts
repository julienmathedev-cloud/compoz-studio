/**
 * @file packages/core/src/domain/site/defaults/theme.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration du thème public (`ThemeSettings`).
 * Utilisées lors de l’initialisation d’un site ou en absence de configuration persistée.
 *
 * @remarks
 * - Configuration déclarative et neutre.
 * - Scope V1 :
 *   - activation light/dark
 *   - police
 *   - reveal
 *   - tokens couleur public
 * - Les tokens reprennent la base visuelle actuelle de Compoz
 *   afin de fournir un rendu par défaut cohérent dès la création d’un site.
 */

import type { ThemeFontId } from "@compoz/core/constants/theme/theme-fonts";
import type {
  PublicThemeTokens,
  ThemeSettings,
} from "@compoz/core/domain/site/entities/theme";

/**
 * Tokens couleur par défaut — thème clair.
 *
 * @remarks
 * Base inspirée du thème actuel de Compoz / site démo :
 * - fond mauve très léger
 * - accents indigo
 * - contrastes doux mais lisibles
 */
export const DEFAULT_LIGHT_THEME_TOKENS: PublicThemeTokens = {
  background: "#FAF9FB",
  foreground: "#211F26",

  card: "#FDFCFD",
  "card-foreground": "#211F26",

  chrome: "#FDFCFD",

  popover: "#FDFCFD",
  "popover-foreground": "#211F26",

  primary: "#3E63DD",
  "primary-foreground": "#FFFFFF",

  secondary: "#EDF2FE",
  "secondary-foreground": "#3A5BC7",

  muted: "#F2EFF3",
  "muted-foreground": "#65636D",

  accent: "#FDFCFD",
  "accent-foreground": "#211F26",

  destructive: "#DC3E42",
  "destructive-foreground": "#FFFFFF",

  border: "#E1E9FF",
  input: "#E1E9FF",
  ring: "#3E63DD",
};

/**
 * Tokens couleur par défaut — thème sombre.
 *
 * @remarks
 * Déduits du thème dark actuel de Compoz :
 * - base slate
 * - accent primaire indigo
 * - contrastes compatibles avec les primitives ShadCN
 */
export const DEFAULT_DARK_THEME_TOKENS: PublicThemeTokens = {
  background: "#FCFCFD",
  foreground: "#1C2024",

  card: "#FFFFFF",
  "card-foreground": "#1C2024",

  chrome: "#FCFCFD",

  popover: "#F9F9FB",
  "popover-foreground": "#1C2024",

  primary: "#3E63DD",
  "primary-foreground": "#FFFFFF",

  secondary: "#F0F0F3",
  "secondary-foreground": "#1C2024",

  muted: "#F0F0F3",
  "muted-foreground": "#60646C",

  accent: "#E8E8EC",
  "accent-foreground": "#1C2024",

  destructive: "#DC3E42",
  "destructive-foreground": "#FFFFFF",

  border: "#D9D9E0",
  input: "#D9D9E0",
  ring: "#3E63DD",
};

export const DEFAULT_THEME_FONT_ID: ThemeFontId = "inter";

/**
 * Valeurs par défaut pour la configuration du thème public.
 */
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  enableDarkMode: true,
  mode: "light",
  fontFamily: DEFAULT_THEME_FONT_ID,
  revealPreset: "fade-up",
  lightTokens: DEFAULT_LIGHT_THEME_TOKENS,
  darkTokens: DEFAULT_DARK_THEME_TOKENS,
};
