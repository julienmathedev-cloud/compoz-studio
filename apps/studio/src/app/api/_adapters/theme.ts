/**
 * @file apps/studio/src/app/api/_adapters/theme.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for theme settings update intents.
 *
 * @remarks
 * - Builds a partial domain patch from the fields present in the intent.
 * - Trims theme token values before domain writes.
 * - Leaves state handling to the route.
 */

import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  PublicThemeTokens,
  ThemeSettings,
} from "@compoz/core/domain/site/entities/theme";
import type { UpdateThemeSettingsInput } from "@compoz/core/domain/site/use-cases/theme/update-theme-settings.types";
import type { UpdateThemeSettingsOCCIntentDTO } from "@compoz/validation/site/settings/theme/theme-intents";

function adaptThemeTokensPatch(
  tokens: PublicThemeTokens | undefined,
): PublicThemeTokens | undefined {
  if (!tokens) return undefined;

  return {
    background: trimOrKeep(tokens.background),
    foreground: trimOrKeep(tokens.foreground),
    chrome: trimOrKeep(tokens.chrome),
    card: trimOrKeep(tokens.card),
    "card-foreground": trimOrKeep(tokens["card-foreground"]),
    popover: trimOrKeep(tokens.popover),
    "popover-foreground": trimOrKeep(tokens["popover-foreground"]),
    primary: trimOrKeep(tokens.primary),
    "primary-foreground": trimOrKeep(tokens["primary-foreground"]),
    secondary: trimOrKeep(tokens.secondary),
    "secondary-foreground": trimOrKeep(tokens["secondary-foreground"]),
    muted: trimOrKeep(tokens.muted),
    "muted-foreground": trimOrKeep(tokens["muted-foreground"]),
    accent: trimOrKeep(tokens.accent),
    "accent-foreground": trimOrKeep(tokens["accent-foreground"]),
    destructive: trimOrKeep(tokens.destructive),
    "destructive-foreground": trimOrKeep(tokens["destructive-foreground"]),
    border: trimOrKeep(tokens.border),
    input: trimOrKeep(tokens.input),
    ring: trimOrKeep(tokens.ring),
  };
}

export function adaptUpdateThemeIntent(
  intent: UpdateThemeSettingsOCCIntentDTO,
): UpdateThemeSettingsInput {
  const dto = intent.patch;
  const started = Date.now();

  log.debug("studio.adapter.theme.patch.start", {
    hasEnableDarkMode: typeof dto.enableDarkMode === "boolean",
    hasMode: typeof dto.mode === "string",
    hasFontFamily: typeof dto.fontFamily === "string",
    hasHeadingFont:
      typeof dto.headingFont === "string" || dto.headingFont === null,
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

  if (typeof dto.headingFont === "string" || dto.headingFont === null) {
    patch.headingFont = dto.headingFont;
  }

  if (typeof dto.revealPreset === "string") {
    patch.revealPreset = dto.revealPreset;
  }

  const lightTokensPatch = adaptThemeTokensPatch(dto.lightTokens);
  if (lightTokensPatch) {
    patch.lightTokens = lightTokensPatch;
  }

  const darkTokensPatch = adaptThemeTokensPatch(dto.darkTokens);
  if (darkTokensPatch) {
    patch.darkTokens = darkTokensPatch;
  }

  log.debug("studio.adapter.theme.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return {
    baseline: {
      ...intent.baseline,
      lightTokens: { ...intent.baseline.lightTokens },
      darkTokens: { ...intent.baseline.darkTokens },
    },
    patch,
    expectedRevision: intent.expectedRevision,
  };
}
