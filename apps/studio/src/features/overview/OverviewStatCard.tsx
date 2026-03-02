"use client";

/**
 * @file apps/studio/src/features/overview/OverviewStatCard.tsx
 * @layer ui/molecules
 *
 * @description
 * Carte statistique (Overview) : titre + valeur principale + breakdown.
 *
 * @remarks
 * - UI-only
 * - Les états loading sont gérés par la section parente
 */

import type { ReactNode } from "react";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";

import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";

export type StatBreakdownItem = Readonly<{
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

export function StatCard({
  title,
  description,
  value,
  breakdownItems,
  isError = false,
}: OverviewStatCardProps) {
  const t = useTranslations();
  const showBreakdown = !isError && breakdownItems && breakdownItems.length > 0;

  return (
    <Card
      variant="panel"
      data-state={isError ? "error" : undefined}
      className={cn(isError && "border-destructive/40", "h-full")}
    >
      <CardHeader>
        <Heading as="h3">{title}</Heading>
        {description && <Text variant="muted">{description}</Text>}
      </CardHeader>

      <CardContent className="flex flex-1 items-end w-full">
        <div className={cn(ROW_BETWEEN, "w-full")}>
          {/* Valeur principale */}
          <Text
            as="p"
            className={cn(
              "text-2xl font-medium",
              isError && "text-destructive",
            )}
          >
            {isError ? "—" : value}
          </Text>

          {/* Côté droit */}
          <div>
            {isError ? (
              <StatusBadge variant="destructive" label={t("common.error")} />
            ) : showBreakdown ? (
              <ul
                className={cn(
                  "grid gap-y-1 text-sm text-muted-foreground",
                  "grid-cols-2 lg:grid-cols-1 xl:grid-cols-2",
                )}
              >
                {breakdownItems.map((it, idx) => (
                  <li key={idx} className="mr-2">
                    <span className="font-medium text-foreground tabular-nums">
                      {it.value}
                    </span>{" "}
                    {it.label}
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

StatCard.displayName = "OverviewStatCard";
