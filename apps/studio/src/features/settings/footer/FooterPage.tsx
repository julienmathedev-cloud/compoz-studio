"use client";

/**
 * @file apps/studio/src/features/settings/footer/FooterPage.tsx
 * @layer ui/studio/pages
 *
 * @description
 * Page « Footer » (studio) — pilote le H1 global et affiche la section Footer.
 *
 * @remarks
 * - Le H1 est rendu en `sr-only` pour garantir une hiérarchie sémantique propre.
 * - Les sections (`SettingsSection`) rendent des H2 par défaut.
 * - Strictement UI-only.
 */

import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { FooterSection } from "@compoz/studio/features/settings/footer/FooterSection";
import { useTranslations } from "next-intl";

export function FooterPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      {/* H1 global de la page (accessibilité / SEO interne studio) */}
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.footer")}
      </Heading>

      {/* Section principale */}
      <FooterSection />
    </div>
  );
}

FooterPage.displayName = "FooterPage";
