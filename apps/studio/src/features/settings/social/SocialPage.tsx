"use client";

/**
 * @file apps/studio/src/features/settings/social/SocialPage.tsx
 * @layer ui/studio/pages
 *
 * @description
 * Page « Social » (studio) — affiche la section Social avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `SocialSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 */

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { SocialSection } from "@compoz/studio/features/settings/social/SocialSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";

/**
 * Page Social (studio).
 */
export function SocialPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.social")}
      </Heading>

      <SocialSection />
    </div>
  );
}

SocialPage.displayName = "SocialPage";
