"use client";

/**
 * @file apps/studio/src/features/settings/seo/SeoPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « SEO » (admin) — affiche la section SEO avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `SeoSection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 */

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { SeoSection } from "@compoz/studio/features/settings/seo/SeoSection";
import { useTranslations } from "next-intl";

/**
 * Page SEO (admin).
 */
export function SeoPage() {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.seo")}
      </Heading>

      <SeoSection />
    </div>
  );
}

SeoPage.displayName = "SeoPage";
