"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemePage.tsx
 * @layer studio/features/settings/theme
 *
 * @description
 * Studio theme settings page.
 *
 * @remarks
 * - Keeps the page-level H1 screen-reader-only so `ThemeSection` can render the visible H2 through `SettingsSection`.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { ThemeSection } from "@compoz/studio/features/settings/theme/ThemeSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

export function ThemePage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.theme")}
      </Heading>

      <ThemeSection />
    </div>
  );
}

ThemePage.displayName = "ThemePage";
