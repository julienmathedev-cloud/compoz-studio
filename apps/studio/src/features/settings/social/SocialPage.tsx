"use client";

/**
 * @file apps/studio/src/features/settings/social/SocialPage.tsx
 * @layer studio/features/settings/social
 *
 * @description
 * Studio social settings page.
 *
 * @remarks
 * - Keeps the page-level H1 screen-reader-only so `SocialSection` can render the visible H2 through `SettingsSection`.
 */

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { SocialSection } from "@compoz/studio/features/settings/social/SocialSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";

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
