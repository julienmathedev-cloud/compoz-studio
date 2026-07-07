/**
 * @file packages/validation/src/site/settings/theme/theme.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the public theme settings boundary shape.
 *
 * @remarks
 * Theme token validation intentionally accepts a limited set of CSS color
 * formats without trying to be a full CSS parser.
 */

import { THEME_FONTS } from "@compoz/core/constants/theme/theme-fonts";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

export const THEME_MODES = ["light", "dark", "system"] as const;
export const REVEAL_PRESETS = [
  "fade",
  "fade-up",
  "scale-in",
  "slide-up",
] as const;

export const THEME_FONT_IDS = THEME_FONTS.map((font) => font.id) as [
  (typeof THEME_FONTS)[number]["id"],
  ...(typeof THEME_FONTS)[number]["id"][],
];

function requiredThemeToken(message: string) {
  return z.string().trim().min(1, message).refine(isValidThemeColorValue, {
    message,
  });
}

function isValidThemeColorValue(value: string): boolean {
  const v = value.trim();

  if (!v) return false;

  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return true;
  if (/^rgba?\(.+\)$/.test(v)) return true;
  if (/^hsla?\(.+\)$/.test(v)) return true;
  if (/^oklch\(.+\)$/.test(v)) return true;
  if (v === "white" || v === "black" || v === "transparent") return true;

  return false;
}

export const PublicThemeTokensSchema = z
  .object({
    background: requiredThemeToken(ERROR_CODES.THEME_TOKEN_BACKGROUND_REQUIRED),
    foreground: requiredThemeToken(ERROR_CODES.THEME_TOKEN_FOREGROUND_REQUIRED),

    chrome: requiredThemeToken(ERROR_CODES.THEME_TOKEN_CHROME_REQUIRED),

    card: requiredThemeToken(ERROR_CODES.THEME_TOKEN_CARD_REQUIRED),
    "card-foreground": requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_CARD_FOREGROUND_REQUIRED,
    ),

    popover: requiredThemeToken(ERROR_CODES.THEME_TOKEN_POPOVER_REQUIRED),
    "popover-foreground": requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_POPOVER_FOREGROUND_REQUIRED,
    ),

    primary: requiredThemeToken(ERROR_CODES.THEME_TOKEN_PRIMARY_REQUIRED),
    "primary-foreground": requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_PRIMARY_FOREGROUND_REQUIRED,
    ),

    secondary: requiredThemeToken(ERROR_CODES.THEME_TOKEN_SECONDARY_REQUIRED),
    "secondary-foreground": requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_SECONDARY_FOREGROUND_REQUIRED,
    ),

    muted: requiredThemeToken(ERROR_CODES.THEME_TOKEN_MUTED_REQUIRED),
    "muted-foreground": requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_MUTED_FOREGROUND_REQUIRED,
    ),

    accent: requiredThemeToken(ERROR_CODES.THEME_TOKEN_ACCENT_REQUIRED),
    "accent-foreground": requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_ACCENT_FOREGROUND_REQUIRED,
    ),

    destructive: requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_DESTRUCTIVE_REQUIRED,
    ),
    "destructive-foreground": requiredThemeToken(
      ERROR_CODES.THEME_TOKEN_DESTRUCTIVE_FOREGROUND_REQUIRED,
    ),

    border: requiredThemeToken(ERROR_CODES.THEME_TOKEN_BORDER_REQUIRED),
    input: requiredThemeToken(ERROR_CODES.THEME_TOKEN_INPUT_REQUIRED),
    ring: requiredThemeToken(ERROR_CODES.THEME_TOKEN_RING_REQUIRED),
  })
  .strict();

export type PublicThemeTokensShape = z.infer<typeof PublicThemeTokensSchema>;

type ThemeSettingsDraft = z.infer<typeof ThemeSettingsObjectSchema>;

export function validateThemeSettingsValues(
  val: ThemeSettingsDraft,
  ctx: z.RefinementCtx,
) {
  if (!val.enableDarkMode) {
    if (val.mode === "dark" || val.mode === "system") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mode"],
        message: ERROR_CODES.THEME_DARK_MODE_DISABLED_INVALID_MODE,
      });
    }
  }
}

export const ThemeSettingsObjectSchema = z
  .object({
    enableDarkMode: z.boolean(),

    mode: z.enum(THEME_MODES, {
      message: ERROR_CODES.THEME_MODE_INVALID,
    }),

    fontFamily: z.enum(THEME_FONT_IDS, {
      message: ERROR_CODES.THEME_FONT_UNSUPPORTED,
    }),

    headingFont: z
      .enum(THEME_FONT_IDS, {
        message: ERROR_CODES.THEME_FONT_UNSUPPORTED,
      })
      .nullable(),

    revealPreset: z.enum(REVEAL_PRESETS, {
      message: ERROR_CODES.THEME_REVEAL_PRESET_INVALID,
    }),

    lightTokens: PublicThemeTokensSchema,
    darkTokens: PublicThemeTokensSchema,
  })
  .strict();

export const ThemeSettingsSchema = ThemeSettingsObjectSchema.superRefine(
  (val, ctx) => validateThemeSettingsValues(val, ctx),
);

export type ThemeSettingsShape = z.infer<typeof ThemeSettingsSchema>;
