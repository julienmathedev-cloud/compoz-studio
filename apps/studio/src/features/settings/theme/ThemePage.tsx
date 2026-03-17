"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemePage.tsx
 * @layer ui/studio/settings/theme/pages
 *
 * @description
 * Page « Theme » (studio) — affiche la section Theme avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `ThemeSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 * - La logique dirty / preview / warnings est encapsulée dans `ThemeSection`.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { ThemeSection } from "@compoz/studio/features/settings/theme/ThemeSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

/**
 * Page Theme (studio).
 */
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
