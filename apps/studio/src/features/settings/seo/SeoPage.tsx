"use client";

/**
 * @file apps/studio/src/features/settings/seo/SeoPage.tsx
 * @layer ui/studio/pages
 *
 * @description
 * Page « SEO » (studio) — affiche la section SEO avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `SeoSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 */

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { SeoSection } from "@compoz/studio/features/settings/seo/SeoSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";

/**
 * Page SEO (studio).
 */
export function SeoPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.seo")}
      </Heading>

      <SeoSection />
    </div>
  );
}

SeoPage.displayName = "SeoPage";
