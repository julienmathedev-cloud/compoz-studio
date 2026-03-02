"use client";

/**
 * @file apps/studio/src/features/overview/sections/OverviewSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section d’accueil de l’admin : état global, actions, stats, preview.
 */

import { useTranslations } from "next-intl";

import { cn } from "@compoz/ui/lib/utils";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

import { useSiteStatus } from "@compoz/studio/features/site/status/useSiteStatus";

import { OverviewPreviewCard } from "@compoz/studio/features/overview/OverviewPreviewCard";
import { OverviewSettingsCard } from "@compoz/studio/features/overview/OverviewSettingsCard";
import { OverviewStatsRow } from "@compoz/studio/features/overview/OverviewStatsRow";
import { OverviewStatusDetailsTable } from "@compoz/studio/features/overview/OverviewStatusDetailsTable";
import { StateAndActionsCard } from "@compoz/studio/features/overview/StateAndActionsCard";

export function OverviewSection() {
  const t = useTranslations();
  const siteStatus = useSiteStatus();

  return (
    <SettingsSection
      id="overview"
      title={t("admin.overviewSection.section.title")}
      description={t("admin.overviewSection.section.description")}
      isLoading={siteStatus.isLoading}
      isBusy={siteStatus.isFetching}
    >
      <StateAndActionsCard
        data={siteStatus.data}
        isError={siteStatus.isError}
      />

      {/* Stats + Settings */}
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4")}>
        <div className="md:col-span-2 lg:col-span-2">
          <OverviewStatsRow
            data={siteStatus.data}
            isError={siteStatus.isError}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <OverviewSettingsCard
            data={siteStatus.data}
            isError={siteStatus.isError}
          />
        </div>
      </div>

      {/* ✅ Table toujours visible, lazy en interne */}
      <OverviewStatusDetailsTable />

      <OverviewPreviewCard />
    </SettingsSection>
  );
}

OverviewSection.displayName = "OverviewSection";
