"use client";

/**
 * @file apps/studio/src/features/overview/OverviewStatsRow.tsx
 * @layer ui/sections
 *
 * @description
 * Ligne de stats : 2 OverviewStatCards (Pages / Blocks) basées sur SiteStatusDTO.
 */

import { useTranslations } from "next-intl";

import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";

import {
  StatCard,
  type StatBreakdownItem,
} from "@compoz/studio/features/overview/OverviewStatCard";

type OverviewStatsRowProps = Readonly<{
  data?: SiteStatusDTO;
  isError?: boolean;
}>;

export function OverviewStatsRow({ data, isError }: OverviewStatsRowProps) {
  const t = useTranslations();

  // Pages
  const pagesDraft = data?.counts?.pages?.draft ?? 0;
  const pagesPublished = data?.counts?.pages?.published ?? 0;
  const pagesNew = data?.counts?.pages?.new ?? 0;
  const pagesModified = data?.counts?.pages?.modified ?? 0;
  const pagesDeleted = data?.counts?.pages?.deleted ?? 0;

  // Blocks
  const blocksDraft = data?.counts?.blocks?.draft ?? 0;
  const blocksPublished = data?.counts?.blocks?.published ?? 0;
  const blocksNew = data?.counts?.blocks?.new ?? 0;
  const blocksModified = data?.counts?.blocks?.modified ?? 0;
  const blocksDeleted = data?.counts?.blocks?.deleted ?? 0;

  const pagesBreakdown: ReadonlyArray<StatBreakdownItem> = [
    {
      label: t("admin.overviewSection.stats.breakdown.published"),
      value: pagesPublished,
    },
    {
      label: t("admin.overviewSection.stats.breakdown.new"),
      value: pagesNew,
    },
    {
      label: t("admin.overviewSection.stats.breakdown.modified"),
      value: pagesModified,
    },
    {
      label: t("admin.overviewSection.stats.breakdown.deleted"),
      value: pagesDeleted,
    },
  ];

  const blocksBreakdown: ReadonlyArray<StatBreakdownItem> = [
    {
      label: t("admin.overviewSection.stats.breakdown.published"),
      value: blocksPublished,
    },
    {
      label: t("admin.overviewSection.stats.breakdown.new"),
      value: blocksNew,
    },
    {
      label: t("admin.overviewSection.stats.breakdown.modified"),
      value: blocksModified,
    },
    {
      label: t("admin.overviewSection.stats.breakdown.deleted"),
      value: blocksDeleted,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 h-full">
      <StatCard
        title={t("admin.shared.entities.pages")}
        description={t("admin.overviewSection.stats.pages.description")}
        value={pagesDraft}
        breakdownItems={pagesBreakdown}
        isError={isError}
      />

      <StatCard
        title={t("admin.shared.entities.blocks")}
        description={t("admin.overviewSection.stats.blocks.description")}
        value={blocksDraft}
        breakdownItems={blocksBreakdown}
        isError={isError}
      />
    </div>
  );
}

OverviewStatsRow.displayName = "OverviewStatsRow";
