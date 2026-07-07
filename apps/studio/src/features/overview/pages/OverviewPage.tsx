"use client";

/**
 * @file apps/studio/src/features/overview/pages/OverviewPage.tsx
 * @layer studio/features/overview/pages
 *
 * @description
 * Studio Overview page wrapping the Overview section with a single screen-reader H1.
 *
 * @remarks
 * - The page owns the SR-only H1 so the document keeps one global H1.
 * - `OverviewSection` renders the visible H2 through `SettingsSection`.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { OverviewSection } from "@compoz/studio/features/overview/sections/OverviewSection";

import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

type OverviewPageProps = Readonly<{
  isDemo?: boolean;
  isAdmin?: boolean;
}>;

export function OverviewPage({
  isDemo = false,
  isAdmin = false,
}: OverviewPageProps) {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.overview")}
      </Heading>

      <OverviewSection isDemo={isDemo} isAdmin={isAdmin} />
    </div>
  );
}

OverviewPage.displayName = "OverviewPage";
