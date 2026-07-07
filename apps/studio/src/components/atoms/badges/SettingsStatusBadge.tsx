/**
 * @file apps/studio/src/components/atoms/badges/SettingsStatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Status badge for a settings section in up-to-date, modified, or error states.
 *
 * @remarks
 * Settings cannot be new or deleted.
 */

import { useTranslations } from "next-intl";

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";

export type SettingsStatusKind = "upToDate" | "modified" | "error";

export type SettingsStatusBadgeProps = Readonly<{
  kind: SettingsStatusKind;
}>;

export function SettingsStatusBadge({ kind }: SettingsStatusBadgeProps) {
  const t = useTranslations();

  if (kind === "upToDate") {
    return <StatusBadge variant="success" label={t("common.upToDate")} />;
  }
  if (kind === "modified") {
    return <StatusBadge variant="warning" label={t("common.modified")} />;
  }
  return <StatusBadge variant="error" label={t("common.error")} />;
}

SettingsStatusBadge.displayName = "SettingsStatusBadge";
