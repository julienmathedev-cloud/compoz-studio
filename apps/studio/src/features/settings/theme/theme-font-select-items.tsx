"use client";

/**
 * @file apps/studio/src/features/settings/theme/theme-font-select-items.tsx
 * @layer studio/features/settings/theme
 *
 * @description
 * Helpers UI pour construire les options du select de police du thème.
 */

import type { ReactNode } from "react";

import {
  THEME_FONTS,
  THEME_FONT_CATEGORY_LABEL,
  type ThemeFontId,
} from "@compoz/core/constants/theme/theme-fonts";

export type ThemeFontSelectItem = Readonly<{
  value: ThemeFontId;
  label: ReactNode;
  textLabel: string;
}>;

export function buildThemeFontSelectItems(): ReadonlyArray<ThemeFontSelectItem> {
  return THEME_FONTS.map((font) => ({
    value: font.id,
    textLabel: `${THEME_FONT_CATEGORY_LABEL[font.category]} — ${font.label}`,
    label: (
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{font.label}</p>
          <p className="text-muted-foreground truncate text-xs">
            {THEME_FONT_CATEGORY_LABEL[font.category]} · {font.description}
          </p>
        </div>

        <span
          className="text-muted-foreground shrink-0 text-sm"
          style={{ fontFamily: font.fontFamily }}
          aria-hidden="true"
        >
          Abc
        </span>
      </div>
    ),
  }));
}
