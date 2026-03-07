"use client";

/**
 * @file apps/studio/src/features/pages/blocks/BlocksPage.tsx
 * @layer ui/studio/pages/blocks
 *
 * @description
 * Page « Blocs » (studio).
 *
 * @remarks
 * - Définit le H1 unique (sr-only) pour l’accessibilité.
 * - Délègue l’affichage et la structure à `BlocksSection`.
 * - Conforme au pattern global des pages studio.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { BlocksSection } from "@compoz/studio/features/pages/blocks/BlocksSection";

import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

export function BlocksPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      {/* H1 unique — accessibilité uniquement */}
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.blocks")}
      </Heading>

      {/* Section principale (H2 visible par défaut) */}
      <BlocksSection />
    </div>
  );
}

BlocksPage.displayName = "BlocksPage";
