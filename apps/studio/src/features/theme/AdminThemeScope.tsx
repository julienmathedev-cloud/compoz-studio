"use client";

/**
 * @file apps/studio/src/features/theme/AdminThemeScope.tsx
 * @layer ui/theme
 *
 * @description
 * Scope de thème admin : applique la classe `.admin-theme` sur `<html>` pour couvrir les portals.
 *
 * @remarks
 * - Nécessaire pour les composants Radix rendus via Portal (Select, Popover, Dialog, etc.).
 * - Garantit que les variables CSS et styles de thème s’appliquent hors du wrapper React.
 * - Composant à effet de bord uniquement : ne rend aucun JSX.
 * - À utiliser exclusivement dans le layout Admin.
 * - Strictement UI-only.
 */

import { useEffect } from "react";

const ADMIN_THEME_CLASS = "admin-theme";

export function AdminThemeScope() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(ADMIN_THEME_CLASS);
    root.classList.add(".radix-theme");

    return () => {
      root.classList.remove(ADMIN_THEME_CLASS);
      root.classList.remove(".radix-theme");
    };
  }, []);

  return null;
}

AdminThemeScope.displayName = "AdminThemeScope";
