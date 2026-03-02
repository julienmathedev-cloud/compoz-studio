"use client";

/**
 * @file apps/studio/src/features/settings/footer/FooterPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Footer » (admin) — pilote le H1 global et affiche la section Footer.
 *
 * @remarks
 * - Le H1 est rendu en `sr-only` pour garantir une hiérarchie sémantique propre.
 * - Les sections (`SettingsSection`) rendent des H2 par défaut.
 * - Strictement UI-only.
 */

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { useTranslations } from "next-intl";

import { FooterSection } from "@compoz/studio/features/settings/footer/FooterSection";

export function FooterPage() {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      {/* H1 global de la page (accessibilité / SEO interne admin) */}
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.footer")}
      </Heading>

      {/* Section principale */}
      <FooterSection />
    </div>
  );
}

FooterPage.displayName = "FooterPage";
