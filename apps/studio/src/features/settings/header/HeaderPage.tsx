"use client";

/**
 * @file apps/studio/src/features/settings/header/HeaderPage.tsx
 * @layer studio/features/settings/header
 *
 * @description
 * Studio page shell for header settings.
 *
 * @remarks
 * - Keeps a unique screen-reader-only H1 while `HeaderSection` renders the visible section heading.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { HeaderSection } from "@compoz/studio/features/settings/header/HeaderSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

export function HeaderPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.header")}
      </Heading>

      <HeaderSection />
    </div>
  );
}

HeaderPage.displayName = "HeaderPage";
