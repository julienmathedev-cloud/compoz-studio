"use client";

/**
 * @file apps/studio/src/features/overview/sections/OverviewSection.tsx
 * @layer studio/features/overview/sections
 *
 * @description
 * Studio Overview section showing publication state, metrics, settings status, details, and preview.
 *
 * @remarks
 * - Loads site status and draft settings bundle for overview cards.
 * - Resolves the published base URL from draft SEO settings before passing it to publish actions.
 * - Shows the demo sandbox notice only for demo sessions.
 * - Shows theme settings status only for admin users through `OverviewSettingsCard`.
 */

import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { OverviewDemoSandboxCard } from "@compoz/studio/features/overview/components/OverviewDemoSandboxCard";
import { OverviewPreviewCard } from "@compoz/studio/features/overview/components/OverviewPreviewCard";
import { OverviewPublishCard } from "@compoz/studio/features/overview/components/OverviewPublishCard";
import { OverviewSettingsCard } from "@compoz/studio/features/overview/components/OverviewSettingsCard";
import { OverviewStatsRow } from "@compoz/studio/features/overview/components/OverviewStatsRow";
import { OverviewStatusDetailsTable } from "@compoz/studio/features/overview/components/OverviewStatusDetailsTable";
import { useSettingsBundle } from "@compoz/studio/features/settings/bundle/useSettingsBundle";
import { useSiteStatus } from "@compoz/studio/features/site/status/useSiteStatus";

type OverviewSectionProps = Readonly<{
  isDemo?: boolean;
  isAdmin?: boolean;
}>;

export function OverviewSection({
  isDemo = false,
  isAdmin = false,
}: OverviewSectionProps) {
  const t = useTranslations();

  const { data, isError, isLoading, isFetching } = useSiteStatus();
  const { data: settingsBundle } = useSettingsBundle(DEFAULT_CONTENT_STATE);

  const publishedBaseUrl =
    String(settingsBundle?.seo?.baseUrl ?? "").trim() || null;

  return (
    <SettingsSection
      id="overview"
      title={t("studio.overviewSection.section.title")}
      description={t("studio.overviewSection.section.description")}
      isLoading={isLoading}
      isBusy={isFetching}
    >
      {isDemo ? <OverviewDemoSandboxCard /> : null}

      <OverviewPublishCard
        data={data}
        isError={isError}
        publishedBaseUrl={publishedBaseUrl}
        isDemo={isDemo}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-2">
          <OverviewStatsRow data={data} isError={isError} />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <OverviewSettingsCard
            data={data}
            isError={isError}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <OverviewStatusDetailsTable />

      <OverviewPreviewCard />
    </SettingsSection>
  );
}

OverviewSection.displayName = "OverviewSection";
