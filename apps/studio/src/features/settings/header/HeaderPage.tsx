"use client";

/**
 * @file apps/studio/src/features/settings/header/HeaderPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Header » (admin) — affiche la section Header avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `HeaderSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 * - La logique dirty/preview/warnings est encapsulée dans `HeaderSection`.
 */

import { HeaderSection } from "@compoz/studio/features/settings/header/HeaderSection";
import { useTranslations } from "next-intl";

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";

/**
 * Page Header (admin).
 */
export function HeaderPage() {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.header")}
      </Heading>

      <HeaderSection />
    </div>
  );
}

HeaderPage.displayName = "HeaderPage";
