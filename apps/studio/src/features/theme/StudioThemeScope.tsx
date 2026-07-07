"use client";

/**
 * @file apps/studio/src/features/theme/StudioThemeScope.tsx
 * @layer studio/features/theme
 *
 * @description
 * Applies Studio theme scope classes to the document root.
 *
 * @remarks
 * - Required for Radix components rendered through portals, such as Select, Popover, and Dialog.
 * - Applies theme variables outside the React wrapper by setting classes on `<html>`.
 * - Side-effect-only component intended for the Studio layout.
 */

import { useLayoutEffect } from "react";

const STUDIO_THEME_CLASS = "studio-theme";
const RADIX_THEME_CLASS = "radix-theme";

export function StudioThemeScope() {
  useLayoutEffect(() => {
    const root = document.documentElement;

    root.classList.add(STUDIO_THEME_CLASS);
    root.classList.add(RADIX_THEME_CLASS);

    return () => {
      root.classList.remove(STUDIO_THEME_CLASS);
      root.classList.remove(RADIX_THEME_CLASS);
    };
  }, []);

  return null;
}

StudioThemeScope.displayName = "StudioThemeScope";
