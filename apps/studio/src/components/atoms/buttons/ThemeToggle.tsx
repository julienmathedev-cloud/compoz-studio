"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/ThemeToggle.tsx
 * @layer studio/atoms
 *
 * @description
 * Bouton de bascule du thème (clair / sombre) pour l’interface Studio.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Délègue la gestion du thème au `StudioThemeProvider`.
 * - Utilise exclusivement `StudioIcon` pour l’affichage des icônes.
 * - Accessibilité assurée via `aria-label` et tooltip.
 */

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { useStudioTheme } from "@compoz/studio/features/theme/StudioThemeProvider";

/**
 * Bascule le thème de l’interface Studio (light / dark).
 */
export function ThemeToggle() {
  const { theme, toggle } = useStudioTheme();
  const isDark = theme === "dark";
  const t = useTranslations();

  return (
    <TooltipButton
      type="button"
      variant="header"
      size="icon"
      disabled={true}
      onClick={toggle}
      aria-label={isDark ? t("studio.theme.toLight") : t("studio.theme.toDark")}
      tooltip={t("common.availableInNextVersion")}
      //tooltip={isDark ? t("studio.theme.toLight") : t("studio.theme.toDark")}
    >
      <StudioIcon icon={isDark ? Sun : Moon} />
    </TooltipButton>
  );
}

ThemeToggle.displayName = "ThemeToggle";
