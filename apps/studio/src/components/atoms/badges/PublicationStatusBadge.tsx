/**
 * @file apps/studio/src/components/atoms/badges/PublicationStatusBadge.tsx
 * @layer ui/atoms
 *
 * @description
 * Badge de statut de publication (published/never/publishing/changesPending/upToDate/error).
 */

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";
import { useTranslations } from "next-intl";

export type PublicationStatusKind =
  | "published"
  | "never"
  | "publishing"
  | "changesPending"
  | "upToDate"
  | "error";

export type PublicationStatusBadgeProps = Readonly<{
  kind: PublicationStatusKind;
}>;

export function PublicationStatusBadge({ kind }: PublicationStatusBadgeProps) {
  const t = useTranslations();

  const map = {
    published: {
      variant: "success",
      label: t("common.published"),
    },
    never: {
      variant: "info",
      label: t("admin.overviewSection.globalStatus.never"),
    },
    publishing: {
      variant: "info",
      label: t("common.publishing"),
    },
    changesPending: {
      variant: "warning",
      label: t("admin.overviewSection.globalStatus.changesPending"),
    },
    upToDate: { variant: "success", label: t("common.upToDate") },
    error: { variant: "destructive", label: t("common.error") },
  } as const;

  const cfg = map[kind] ?? map.error;
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

PublicationStatusBadge.displayName = "PublicationStatusBadge";
