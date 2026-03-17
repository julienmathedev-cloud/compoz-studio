/**
 * @file apps/studio/src/components/atoms/badges/SettingsStatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Badge de statut pour une section de réglages (upToDate/modified/error).
 *
 * @remarks
 * Les réglages ne peuvent pas être "new" ni "deleted".
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
    return <StatusBadge variant="successStudio" label={t("common.upToDate")} />;
  }
  if (kind === "modified") {
    return <StatusBadge variant="warningStudio" label={t("common.modified")} />;
  }
  return <StatusBadge variant="errorStudio" label={t("common.error")} />;
}

SettingsStatusBadge.displayName = "SettingsStatusBadge";
