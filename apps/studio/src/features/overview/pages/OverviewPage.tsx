"use client";

/**
 * @file apps/studio/src/features/overview/pages/OverviewPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Aperçu » (admin) — affiche la section Overview avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `OverviewSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { OverviewSection } from "@compoz/studio/features/overview/sections/OverviewSection";

import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

/**
 * Page Overview (admin).
 */
export function OverviewPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.overview")}
      </Heading>

      <OverviewSection />
    </div>
  );
}

OverviewPage.displayName = "OverviewPage";
