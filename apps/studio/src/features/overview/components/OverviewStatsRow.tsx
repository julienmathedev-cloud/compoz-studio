"use client";

/**
 * @file apps/studio/src/features/overview/components/OverviewStatsRow.tsx
 * @layer studio/features/overview/components
 *
 * @description
 * Overview statistics row showing page and block count cards from `SiteStatusDTO`.
 *
 * @remarks
 * - Displays counts computed server-side by the `site/status` route.
 * - Keeps loading and error handling delegated to child stat cards and the parent section.
 */

import { useTranslations } from "next-intl";

import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";

import {
  OverviewStatCard,
  type StatBreakdownItem,
} from "@compoz/studio/features/overview/components/OverviewStatCard";

type OverviewStatsRowProps = Readonly<{
  data?: SiteStatusDTO;
  isError?: boolean;
}>;

export function OverviewStatsRow({ data, isError }: OverviewStatsRowProps) {
  const t = useTranslations();

  // Counts from the status payload.

  const pagesCounts = data?.counts?.pages;
  const blocksCounts = data?.counts?.blocks;

  const pagesDraft = pagesCounts?.draft ?? 0;
  const pagesPublished = pagesCounts?.published ?? 0;
  const pagesNew = pagesCounts?.new ?? 0;
  const pagesModified = pagesCounts?.modified ?? 0;
  const pagesDeleted = pagesCounts?.deleted ?? 0;

  const blocksDraft = blocksCounts?.draft ?? 0;
  const blocksPublished = blocksCounts?.published ?? 0;
  const blocksNew = blocksCounts?.new ?? 0;
  const blocksModified = blocksCounts?.modified ?? 0;
  const blocksDeleted = blocksCounts?.deleted ?? 0;

  const pagesBreakdown: ReadonlyArray<StatBreakdownItem> = [
    {
      key: "published",
      label: t("studio.overviewSection.stats.breakdown.published"),
      value: pagesPublished,
    },
    {
      key: "new",
      label: t("studio.overviewSection.stats.breakdown.new"),
      value: pagesNew,
    },
    {
      key: "modified",
      label: t("studio.overviewSection.stats.breakdown.modified"),
      value: pagesModified,
    },
    {
      key: "deleted",
      label: t("studio.overviewSection.stats.breakdown.deleted"),
      value: pagesDeleted,
    },
  ];

  const blocksBreakdown: ReadonlyArray<StatBreakdownItem> = [
    {
      key: "published",
      label: t("studio.overviewSection.stats.breakdown.published"),
      value: blocksPublished,
    },
    {
      key: "new",
      label: t("studio.overviewSection.stats.breakdown.new"),
      value: blocksNew,
    },
    {
      key: "modified",
      label: t("studio.overviewSection.stats.breakdown.modified"),
      value: blocksModified,
    },
    {
      key: "deleted",
      label: t("studio.overviewSection.stats.breakdown.deleted"),
      value: blocksDeleted,
    },
  ];

  return (
    <div className="grid h-full gap-4 sm:grid-cols-2">
      <OverviewStatCard
        title={t("studio.shared.entities.pages")}
        description={t("studio.overviewSection.stats.pages.description")}
        value={pagesDraft}
        breakdownItems={pagesBreakdown}
        isError={isError}
      />

      <OverviewStatCard
        title={t("studio.shared.entities.blocks")}
        description={t("studio.overviewSection.stats.blocks.description")}
        value={blocksDraft}
        breakdownItems={blocksBreakdown}
        isError={isError}
      />
    </div>
  );
}

OverviewStatsRow.displayName = "OverviewStatsRow";
