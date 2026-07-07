"use client";

/**
 * @file apps/studio/src/features/settings/identity/IdentityPage.tsx
 * @layer studio/features/settings/identity
 *
 * @description
 * Studio page shell for identity settings.
 *
 * @remarks
 * - Keeps a unique screen-reader-only H1 while `IdentitySection` renders the visible section heading.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { IdentitySection } from "@compoz/studio/features/settings/identity/IdentitySection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

export function IdentityPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.identity")}
      </Heading>

      <IdentitySection />
    </div>
  );
}

IdentityPage.displayName = "IdentityPage";
