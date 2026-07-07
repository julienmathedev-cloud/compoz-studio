"use client";

/**
 * @file apps/studio/src/features/pages/blocks/BlocksPage.tsx
 * @layer studio/features/pages/blocks
 *
 * @description
 * Studio Blocks page wrapping the blocks section with a single screen-reader H1.
 *
 * @remarks
 * - The page owns the SR-only H1 so the document keeps one global H1.
 * - `BlocksSection` renders the visible section heading.
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
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.blocks")}
      </Heading>

      <BlocksSection />
    </div>
  );
}

BlocksPage.displayName = "BlocksPage";
