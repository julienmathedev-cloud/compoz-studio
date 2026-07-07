/**
 * @file packages/core/src/domain/site/entities/theme.ts
 * @layer core/domain/site/entities
 * @description Canonical public theme settings for a site.
 * @remarks
 * This entity defines persisted theme shape only; runtime resolution belongs outside core.
 */

import type { ThemeFontId } from "@compoz/core/constants/theme/theme-fonts";

export type PublicThemeTokens = {
  background: string;
  foreground: string;

  /** Shared structural surface token for header and footer chrome. */
  chrome: string;

  card: string;
  "card-foreground": string;

  popover: string;
  "popover-foreground": string;

  primary: string;
  "primary-foreground": string;

  secondary: string;
  "secondary-foreground": string;

  muted: string;
  "muted-foreground": string;

  accent: string;
  "accent-foreground": string;

  destructive: string;
  "destructive-foreground": string;

  border: string;
  input: string;
  ring: string;
};

/** Public theme mode supported by the domain model. */
export type ThemeMode = "light" | "dark" | "system";

/** Public reveal animation preset supported by the domain model. */
export type RevealPreset = "fade" | "fade-up" | "scale-in" | "slide-up";

export interface ThemeSettings {
  /** When disabled, public rendering stays light-only. */
  enableDarkMode: boolean;

  mode: ThemeMode;

  /** Canonical font reference from the supported theme font registry. */
  fontFamily: ThemeFontId;

  /** `null` means headings reuse `fontFamily`. */
  headingFont: ThemeFontId | null;

  revealPreset: RevealPreset;

  lightTokens: PublicThemeTokens;

  /** Kept even when dark mode is disabled so persisted settings stay complete. */
  darkTokens: PublicThemeTokens;
}
