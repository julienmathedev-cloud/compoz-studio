/**
 * @file apps/studio/src/components/atoms/badges/DiffStatusBadge.tsx
 * @layer ui/atoms
 *
 * @description
 * Badge de statut de diff (upToDate/new/dirty/deleted) à côté d’une page/bloc.
 */

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";
import { useTranslations } from "next-intl";

export type DiffStatusKind = "published" | "new" | "modified" | "deleted";

export type DiffStatusBadgeProps = Readonly<{
  kind: DiffStatusKind;
  publishedLabel?: string;
}>;

export function DiffStatusBadge({
  kind,
  publishedLabel,
}: DiffStatusBadgeProps) {
  const t = useTranslations();
  const pLabel = publishedLabel ?? t("common.published");

  const map = {
    published: {
      variant: "success",
      label: pLabel,
    },
    modified: { variant: "warning", label: t("common.modified") },
    new: { variant: "info", label: t("common.new") },
    deleted: { variant: "destructive", label: t("common.deleted") },
  } as const;

  const cfg = map[kind] ?? map.published;

  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

DiffStatusBadge.displayName = "DiffStatusBadge";
