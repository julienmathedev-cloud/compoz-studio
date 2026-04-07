"use client";

/**
 * @file apps/studio/src/features/overview/components/OverviewStatCard.tsx
 * @layer ui/studio/overview
 *
 * @description
 * Carte statistique (overview) : titre + valeur principale + breakdown.
 *
 * @remarks
 * - UI-only.
 * - Les états loading sont gérés par la section parente.
 */

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN } from "@compoz/ui/styles/studio/layout";

export type StatBreakdownItem = Readonly<{
  key: string;
  label: ReactNode;
  value: number;
}>;

type OverviewStatCardProps = Readonly<{
  title: string;
  description?: string;
  value: number;
  breakdownItems?: ReadonlyArray<StatBreakdownItem>;
  isError?: boolean;
}>;

export function OverviewStatCard({
  title,
  description,
  value,
  breakdownItems,
  isError = false,
}: OverviewStatCardProps) {
  const t = useTranslations();

  const showBreakdown =
    !isError && Boolean(breakdownItems && breakdownItems.length > 0);

  return (
    <Card
      variant="panel"
      visualMode="studio"
      data-state={isError ? "error" : undefined}
      className={cn(isError ? "border-destructive/40" : undefined, "h-full")}
    >
      <CardHeader>
        <Heading as="h3">{title}</Heading>
        {description ? <Text variant="muted">{description}</Text> : null}
      </CardHeader>

      <CardContent className="flex w-full flex-1 items-end">
        <div className={cn(ROW_BETWEEN, "w-full")}>
          <Text
            as="p"
            className={cn(
              "text-2xl font-medium",
              isError ? "text-destructive" : undefined,
            )}
          >
            {isError ? "—" : value}
          </Text>

          <div>
            {isError ? (
              <StatusBadge variant="error" label={t("common.error")} />
            ) : showBreakdown ? (
              <ul
                className={cn(
                  "grid grid-cols-2 gap-y-1 text-sm text-muted-foreground lg:grid-cols-1 xl:grid-cols-2",
                )}
              >
                {breakdownItems?.map((item) => (
                  <li key={item.key} className="mr-2">
                    <span className="font-medium tabular-nums text-foreground">
                      {item.value}
                    </span>{" "}
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

OverviewStatCard.displayName = "OverviewStatCard";
