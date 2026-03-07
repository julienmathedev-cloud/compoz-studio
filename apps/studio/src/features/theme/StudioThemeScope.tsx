"use client";

/**
 * @file apps/studio/src/features/theme/StudioThemeScope.tsx
 * @layer ui/theme
 *
 * @description
 * Scope de thème Studio : applique la classe `.studio-theme` sur `<html>`
 * afin de couvrir les portals (Radix).
 *
 * @remarks
 * - Nécessaire pour les composants Radix rendus via Portal
 *   (Select, Popover, Dialog, etc.).
 * - Garantit que les variables CSS et styles de thème s’appliquent
 *   hors du wrapper React.
 * - Composant à effet de bord uniquement : ne rend aucun JSX.
 * - À utiliser exclusivement dans le layout Studio.
 * - Strictement UI-only.
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
