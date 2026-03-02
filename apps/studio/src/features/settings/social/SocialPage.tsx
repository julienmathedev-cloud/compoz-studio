"use client";

/**
 * @file apps/studio/src/features/settings/social/SocialPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Social » (admin) — affiche la section Social avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `SocialSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 */

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { SocialSection } from "@compoz/studio/features/settings/social/SocialSection";
import { useTranslations } from "next-intl";

/**
 * Page Social (admin).
 */
export function SocialPage() {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.social")}
      </Heading>

      <SocialSection />
    </div>
  );
}

SocialPage.displayName = "SocialPage";
