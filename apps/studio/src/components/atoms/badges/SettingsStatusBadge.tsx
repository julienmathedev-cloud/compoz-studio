/**
 * @file apps/studio/src/components/atoms/badges/SettingsStatusBadge.tsx
 * @layer ui/atoms
 *
 * @description
 * Badge de statut pour une section de réglages (upToDate/dirty/error).
 *
 * @remarks
 * Les réglages ne peuvent pas être "new" ni "deleted".
 */

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";
import { useTranslations } from "next-intl";

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
  return <StatusBadge variant="destructive" label={t("common.error")} />;
}

SettingsStatusBadge.displayName = "SettingsStatusBadge";
