"use client";

/**
 * @file apps/studio/src/features/overview/components/OverviewSettingsCard.tsx
 * @layer studio/features/overview/components
 *
 * @description
 * Overview settings card showing each settings section with its current status badge.
 *
 * @remarks
 * - Reads `SiteStatusDTO` and displays changed settings computed by the status route.
 * - Shows the theme settings status only for admin users.
 */

import { useTranslations } from "next-intl";

import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";
import { SettingsStatusBadge } from "@compoz/studio/components/atoms/badges/SettingsStatusBadge";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";

type OverviewSettingsCardProps = Readonly<{
  data?: SiteStatusDTO;
  isError?: boolean;
  isAdmin?: boolean;
}>;

export function OverviewSettingsCard({
  data,
  isError,
  isAdmin = false,
}: OverviewSettingsCardProps) {
  const t = useTranslations();

  const changed = data?.changedSettings;

  const baseItems = [
    { key: "identity", label: t("studio.shared.entities.identity") },
    { key: "primaryMenu", label: t("studio.shared.entities.primaryMenu") },
    { key: "legalMenu", label: t("studio.shared.entities.legalMenu") },
    { key: "social", label: t("studio.shared.entities.social") },
    { key: "header", label: t("studio.shared.entities.header") },
    { key: "footer", label: t("studio.shared.entities.footer") },
    { key: "seo", label: t("studio.shared.entities.seo") },
  ] as const;

  const visibleItems = isAdmin
    ? ([
        ...baseItems,
        { key: "theme", label: t("studio.shared.entities.theme") },
      ] as const)
    : baseItems;

  return (
    <Card
      variant="panel"
      visualMode="studio"
      data-state={isError ? "error" : undefined}
      className={cn(isError ? "border-destructive/40" : undefined)}
    >
      <CardHeader>
        <Heading as="h3">{t("studio.overviewSection.settings.title")}</Heading>

        <Text as="p" variant="muted">
          {t("studio.overviewSection.settings.description")}
        </Text>
      </CardHeader>

      <CardContent className={cn(STACK_MD)}>
        <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {visibleItems.map((item) => {
            const isChanged = Boolean(changed?.[item.key]);

            const statusKind = isError
              ? "error"
              : isChanged
                ? "modified"
                : "upToDate";

            return (
              <div
                key={item.key}
                className="grid grid-cols-[1fr_auto] items-center gap-3"
              >
                <Text as="span" variant="muted" className="font-medium">
                  {item.label}
                </Text>

                <SettingsStatusBadge kind={statusKind} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

OverviewSettingsCard.displayName = "OverviewSettingsCard";
