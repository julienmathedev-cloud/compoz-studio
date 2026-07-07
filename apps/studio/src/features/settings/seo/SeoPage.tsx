"use client";

/**
 * @file apps/studio/src/features/settings/seo/SeoPage.tsx
 * @layer studio/features/settings/seo
 *
 * @description
 * Studio SEO settings page.
 *
 * @remarks
 * - Keeps the page-level H1 screen-reader-only so `SeoSection` can render the visible H2 through `SettingsSection`.
 */

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { SeoSection } from "@compoz/studio/features/settings/seo/SeoSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";

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
