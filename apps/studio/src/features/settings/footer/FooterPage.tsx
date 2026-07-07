"use client";

/**
 * @file apps/studio/src/features/settings/footer/FooterPage.tsx
 * @layer studio/features/settings/footer
 *
 * @description
 * Studio page shell for footer settings.
 *
 * @remarks
 * - Keeps a unique screen-reader-only H1 while `FooterSection` renders the visible section heading.
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
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.footer")}
      </Heading>

      <FooterSection />
    </div>
  );
}

FooterPage.displayName = "FooterPage";
