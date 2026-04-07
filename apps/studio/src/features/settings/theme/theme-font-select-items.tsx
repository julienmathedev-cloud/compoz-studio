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
  return THEME_FONTS.map((font) => {
    const textLabel = `${font.label} · ${THEME_FONT_CATEGORY_LABEL[font.category]} · ${font.description}`;

    return {
      value: font.id,
      textLabel,
      label: (
        <span className="inline-flex min-w-0 items-center gap-3">
          <span className="truncate">
            <span className="font-medium">{font.label}</span>
            <span className="text-muted-foreground">
              {" · "}
              {THEME_FONT_CATEGORY_LABEL[font.category]}
              {" · "}
              {font.description}
            </span>
          </span>

          <span
            className="text-muted-foreground shrink-0 text-sm"
            style={{ fontFamily: font.fontFamily }}
            aria-hidden="true"
          >
            Abc
          </span>
        </span>
      ),
    };
  });
}
