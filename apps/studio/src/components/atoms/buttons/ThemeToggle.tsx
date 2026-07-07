"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/ThemeToggle.tsx
 * @layer studio/atoms
 *
 * @description
 * Studio theme toggle button for light and dark modes.
 *
 * @remarks
 * - Delegates theme state management to `StudioThemeProvider`.
 * - Accessibility is handled through `aria-label` and tooltip text.
 */

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { useStudioTheme } from "@compoz/studio/features/theme/StudioThemeProvider";
export function ThemeToggle() {
  const { theme, toggle } = useStudioTheme();
  const isDark = theme === "dark";
  const t = useTranslations();

  return (
    <TooltipButton
      type="button"
      variant="header"
      visualMode="studio"
      size="icon"
      disabled={true}
      onClick={toggle}
      aria-label={isDark ? t("studio.theme.toLight") : t("studio.theme.toDark")}
      tooltip={t("common.availableInNextVersion")}
    >
      <StudioIcon icon={isDark ? Sun : Moon} />
    </TooltipButton>
  );
}

ThemeToggle.displayName = "ThemeToggle";
