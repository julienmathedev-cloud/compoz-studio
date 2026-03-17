/**
 * @file apps/studio/src/components/atoms/badges/DiffStatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Badge de statut de diff (published/new/modified/deleted) à côté d’une page/bloc.
 */

import { useTranslations } from "next-intl";

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";

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
      variant: "successStudio",
      label: pLabel,
    },
    modified: { variant: "warningStudio", label: t("common.modified") },
    new: { variant: "infoStudio", label: t("common.new") },
    deleted: { variant: "errorStudio", label: t("common.deleted") },
  } as const;

  const cfg = map[kind];

  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

DiffStatusBadge.displayName = "DiffStatusBadge";
