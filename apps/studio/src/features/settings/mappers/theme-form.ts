/**
 * @file apps/studio/src/features/settings/mappers/theme-form.ts
 * @layer ui-mappers/studio/site
 * @description
 * Mappers UI Theme (studio forms) :
 * - DTO -> valeurs de formulaire RHF
 * - normalisation UI
 * - PATCH intent DTO pour l’API studio
 *
 * @remarks
 * - Pour la shape runtime à partir d’un DTO : `toThemeSettingsShapeFromDTO` (shared).
 * - Pour la shape runtime à partir du form : `toThemeSettingsShapeFromFormValues`.
 */

import { getThemeFontById } from "@compoz/core/constants/theme/theme-fonts";
import { DEFAULT_THEME_FONT_ID } from "@compoz/core/domain/site/defaults/theme";
import type { ThemeSettingsDTO } from "@compoz/core/domain/site/dto";
import {
  ThemeSettingsSchema,
  type ThemeSettingsShape,
} from "@compoz/validation/site/settings/theme/theme";
import type { ThemeFormValues } from "@compoz/validation/site/settings/theme/theme-form";
import type { UpdateThemeSettingsIntentDTO } from "@compoz/validation/site/settings/theme/theme-intents";

import { asBool, trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { toThemeSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/theme-shape";

/* ----------------------- Helpers ------------------------------------------ */

function normalizeThemeTokens(
  tokens: ThemeFormValues["lightTokens"] | ThemeFormValues["darkTokens"],
) {
  return {
    background: trimKeepEmpty(tokens.background),
    foreground: trimKeepEmpty(tokens.foreground),

    card: trimKeepEmpty(tokens.card),
    "card-foreground": trimKeepEmpty(tokens["card-foreground"]),

    popover: trimKeepEmpty(tokens.popover),
    "popover-foreground": trimKeepEmpty(tokens["popover-foreground"]),

    primary: trimKeepEmpty(tokens.primary),
    "primary-foreground": trimKeepEmpty(tokens["primary-foreground"]),

    secondary: trimKeepEmpty(tokens.secondary),
    "secondary-foreground": trimKeepEmpty(tokens["secondary-foreground"]),

    muted: trimKeepEmpty(tokens.muted),
    "muted-foreground": trimKeepEmpty(tokens["muted-foreground"]),

    accent: trimKeepEmpty(tokens.accent),
    "accent-foreground": trimKeepEmpty(tokens["accent-foreground"]),

    destructive: trimKeepEmpty(tokens.destructive),
    "destructive-foreground": trimKeepEmpty(tokens["destructive-foreground"]),

    border: trimKeepEmpty(tokens.border),
    input: trimKeepEmpty(tokens.input),
    ring: trimKeepEmpty(tokens.ring),
  };
}

function normalizeThemeFontFamily(value: string | null | undefined) {
  const normalized = trimKeepEmpty(value);

  return getThemeFontById(normalized)?.id ?? DEFAULT_THEME_FONT_ID;
}

/* ----------------------- Domaine (DTO) -> UI (form values) ---------------- */

export function toThemeFormValuesFromDTO(
  dto: ThemeSettingsDTO,
): ThemeFormValues {
  return {
    enableDarkMode: asBool(dto.enableDarkMode),
    mode: dto.mode,
    fontFamily: normalizeThemeFontFamily(dto.fontFamily),
    revealPreset: dto.revealPreset,
    lightTokens: normalizeThemeTokens(dto.lightTokens),
    darkTokens: normalizeThemeTokens(dto.darkTokens),
  };
}

/* ------------------- Studio (RHF) -> Preview/Public (SettingsShape) ------- */

export function toThemeSettingsShapeFromFormValues(
  values: ThemeFormValues,
): ThemeSettingsShape {
  const candidate = {
    enableDarkMode: asBool(values.enableDarkMode),
    mode: values.mode,
    fontFamily: normalizeThemeFontFamily(values.fontFamily),
    revealPreset: values.revealPreset,
    lightTokens: normalizeThemeTokens(values.lightTokens),
    darkTokens: normalizeThemeTokens(values.darkTokens),
  } satisfies ThemeSettingsShape;

  const parsed = ThemeSettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : candidate;
}

/**
 * DTO -> Shape (re-export studio convenience)
 *
 * @remarks
 * Optionnel : utile si tu veux éviter d’importer
 * `@compoz/ui/settings/mappers/theme-shape` dans certains fichiers studio.
 */
export function toThemeSettingsShape(
  dto: ThemeSettingsDTO,
): ThemeSettingsShape {
  return toThemeSettingsShapeFromDTO(dto);
}

/* ---------------------------- Normalisations UI --------------------------- */

export function normalizeThemeFormValues(
  values: ThemeFormValues,
): ThemeFormValues {
  return {
    enableDarkMode: asBool(values.enableDarkMode),
    mode: values.mode,
    fontFamily: normalizeThemeFontFamily(values.fontFamily),
    revealPreset: values.revealPreset,
    lightTokens: normalizeThemeTokens(values.lightTokens),
    darkTokens: normalizeThemeTokens(values.darkTokens),
  };
}

/* ------------------------------ UI -> PATCH (API) ------------------------- */

export function toUpdateThemeIntentDTOFromFormValues(
  p: Partial<ThemeFormValues>,
): UpdateThemeSettingsIntentDTO {
  const out: UpdateThemeSettingsIntentDTO = {};

  if ("enableDarkMode" in p) {
    out.enableDarkMode = asBool(p.enableDarkMode);
  }

  if ("mode" in p && p.mode) {
    out.mode = p.mode;
  }

  if ("fontFamily" in p) {
    out.fontFamily = normalizeThemeFontFamily(p.fontFamily);
  }

  if ("revealPreset" in p && p.revealPreset) {
    out.revealPreset = p.revealPreset;
  }

  if ("lightTokens" in p && p.lightTokens) {
    out.lightTokens = normalizeThemeTokens(p.lightTokens);
  }

  if ("darkTokens" in p && p.darkTokens) {
    out.darkTokens = normalizeThemeTokens(p.darkTokens);
  }

  return out;
}
