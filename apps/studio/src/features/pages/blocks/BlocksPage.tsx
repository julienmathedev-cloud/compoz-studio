"use client";

/**
 * @file apps/studio/src/features/pages/blocks/BlocksPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Blocs » (admin).
 *
 * @remarks
 * - Définit le H1 unique (sr-only) pour l’accessibilité.
 * - Délègue l’affichage et la structure à `BlocksSection`.
 * - Conforme au pattern global des pages admin.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { BlocksSection } from "@compoz/studio/features/pages/blocks/BlocksSection";

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";

export function BlocksPage() {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      {/* H1 unique — accessibilité uniquement */}
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.blocks")}
      </Heading>

      {/* Section principale (H2 visible par défaut) */}
      <BlocksSection />
    </div>
  );
}

BlocksPage.displayName = "BlocksPage";
