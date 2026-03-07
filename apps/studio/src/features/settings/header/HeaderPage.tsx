"use client";

/**
 * @file apps/studio/src/features/settings/header/HeaderPage.tsx
 * @layer ui/studio/pages
 *
 * @description
 * Page « Header » (studio) — affiche la section Header avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `HeaderSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 * - La logique dirty/preview/warnings est encapsulée dans `HeaderSection`.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { HeaderSection } from "@compoz/studio/features/settings/header/HeaderSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

/**
 * Page Header (studio).
 */
export function HeaderPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.header")}
      </Heading>

      <HeaderSection />
    </div>
  );
}

HeaderPage.displayName = "HeaderPage";
