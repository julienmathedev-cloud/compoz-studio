"use client";

/**
 * @file apps/studio/src/features/overview/OverviewSettingsCard.tsx
 * @layer ui/overview
 *
 * @description
 * Carte “Réglages” : liste des sections settings avec badge (À jour / Modifié).
 *
 * @remarks
 * - UI-only : lit `SiteStatusDTO`.
 * - Le calcul “changed per setting” est fait côté serveur dans la route status.
 */

import { useTranslations } from "next-intl";

import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";

import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";

import { SettingsStatusBadge } from "@compoz/studio/components/atoms/badges/SettingsStatusBadge";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";

type OverviewSettingsCardProps = Readonly<{
  data?: SiteStatusDTO;
  isError?: boolean;
}>;

export function OverviewSettingsCard({
  data,
  isError,
}: OverviewSettingsCardProps) {
  const t = useTranslations();

  // ✅ aligné DTO : dirtySettings -> changedSettings
  const changed = data?.changedSettings;

  const items = [
    { key: "identity", label: t("admin.shared.entities.identity") },
    { key: "primaryMenu", label: t("admin.shared.entities.primaryMenu") },
    { key: "legalMenu", label: t("admin.shared.entities.legalMenu") },
    { key: "social", label: t("admin.shared.entities.social") },
    { key: "header", label: t("admin.shared.entities.header") },
    { key: "footer", label: t("admin.shared.entities.footer") },
    { key: "seo", label: t("admin.shared.entities.seo") },
  ] as const;

  return (
    <Card
      variant="panel"
      data-state={isError ? "error" : undefined}
      className={cn(isError ? "border-destructive/40" : undefined)}
    >
      <CardHeader>
        <Heading as="h3">{t("admin.overviewSection.settings.title")}</Heading>
        <Text as="p" variant="muted">
          {t("admin.overviewSection.settings.description")}
        </Text>
      </CardHeader>

      <CardContent className={cn(STACK_MD)}>
        <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {items.map((it) => {
            const isChanged = Boolean(changed?.[it.key]);

            // ✅ aligné avec ton vocabulaire : modified / upToDate
            const statusKind = isError
              ? "error"
              : isChanged
                ? "modified"
                : "upToDate";

            return (
              <div
                key={it.key}
                className="grid grid-cols-[1fr_auto] items-center gap-3"
              >
                <Text as="span" variant="muted" className="font-medium">
                  {it.label}
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
