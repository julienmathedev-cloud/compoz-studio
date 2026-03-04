"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/AdminThemeToggle.tsx
 * @layer ui/atoms
 *
 * @description
 * Bouton de bascule du thème (clair / sombre) pour l’interface d’administration.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Délègue la gestion du thème au `AdminThemeProvider`.
 * - Utilise exclusivement `AdminIcon` pour l’affichage des icônes.
 * - Accessibilité assurée via `aria-label` et tooltip.
 */

import { Moon, Sun } from "lucide-react";

import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { useAdminTheme } from "@compoz/studio/features/theme/AdminThemeProvider";
import { useTranslations } from "next-intl";

/**
 * Bascule le thème de l’interface d’administration (light / dark).
 */
export function AdminThemeToggle() {
  const { theme, toggle } = useAdminTheme();
  const isDark = theme === "dark";
  const t = useTranslations();

  return (
    <TooltipButton
      type="button"
      variant="header"
      size="icon"
      disabled={true}
      onClick={toggle}
      aria-label={isDark ? t("admin.theme.toLight") : t("admin.theme.toDark")}
      tooltip={t("common.availableInNextVersion")}
      //tooltip={isDark ? t("admin.theme.toLight") : t("admin.theme.toDark")}
    >
      <AdminIcon icon={isDark ? Sun : Moon} />
    </TooltipButton>
  );
}

AdminThemeToggle.displayName = "AdminThemeToggle";
