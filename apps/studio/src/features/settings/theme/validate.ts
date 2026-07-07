"use client";

/**
 * @file apps/studio/src/features/settings/theme/validate.ts
 * @layer studio/features/settings/theme
 *
 * @description
 * Non-blocking studio warning helpers for public theme settings.
 *
 * @remarks
 * - Domain validation remains handled by Zod and server use cases.
 * - These warnings only support editor UX by flagging low color contrast in the active token mode.
 */

import { useMemo } from "react";

import type { ThemeFormValues } from "@compoz/validation/site/settings/theme/theme-form";

export type ThemeWarningKey =
  | "backgroundForegroundContrastLow"
  | "primaryContrastLow"
  | "secondaryContrastLow"
  | "accentContrastLow"
  | "destructiveContrastLow";

function normalizeHex(value: string | null | undefined): string | null {
  const v = String(value ?? "").trim();

  if (!v) return null;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null;

  if (v.length === 4) {
    return ("#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toUpperCase();
  }

  return v.toUpperCase();
}

function hexToRgb(hex: string): Readonly<{ r: number; g: number; b: number }> {
  const raw = hex.replace("#", "");

  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function srgbChannelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(
  fg: string | null | undefined,
  bg: string | null | undefined,
): number | null {
  const fgHex = normalizeHex(fg);
  const bgHex = normalizeHex(bg);

  if (!fgHex || !bgHex) return null;

  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Default threshold follows WCAG AA contrast for normal text.
function isContrastInsufficient(
  fg: string | null | undefined,
  bg: string | null | undefined,
  minRatio = 4.5,
): boolean {
  const ratio = contrastRatio(fg, bg);

  if (ratio == null) {
    return false;
  }

  return ratio < minRatio;
}

export function computeThemeWarnings(
  values: Pick<ThemeFormValues, "lightTokens" | "darkTokens">,
  mode: "light" | "dark",
): ThemeWarningKey[] {
  const out = new Set<ThemeWarningKey>();
  const tokens = mode === "dark" ? values.darkTokens : values.lightTokens;

  if (isContrastInsufficient(tokens.foreground, tokens.background)) {
    out.add("backgroundForegroundContrastLow");
  }

  if (isContrastInsufficient(tokens["primary-foreground"], tokens.primary)) {
    out.add("primaryContrastLow");
  }

  if (
    isContrastInsufficient(tokens["secondary-foreground"], tokens.secondary)
  ) {
    out.add("secondaryContrastLow");
  }

  if (isContrastInsufficient(tokens["accent-foreground"], tokens.accent)) {
    out.add("accentContrastLow");
  }

  if (
    isContrastInsufficient(tokens["destructive-foreground"], tokens.destructive)
  ) {
    out.add("destructiveContrastLow");
  }

  return Array.from(out);
}

export function useThemeUiWarnings(
  values: Pick<ThemeFormValues, "lightTokens" | "darkTokens">,
  mode: "light" | "dark",
): ThemeWarningKey[] {
  return useMemo(() => computeThemeWarnings(values, mode), [values, mode]);
}
