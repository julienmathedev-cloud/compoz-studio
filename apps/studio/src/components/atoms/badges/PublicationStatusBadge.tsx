/**
 * @file apps/studio/src/components/atoms/badges/PublicationStatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Badge de statut de publication (published/never/publishing/changesPending/upToDate/error).
 */

import { useTranslations } from "next-intl";

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";

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
      variant: "successStudio",
      label: t("common.published"),
    },
    never: {
      variant: "infoStudio",
      label: t("studio.overviewSection.globalStatus.never"),
    },
    publishing: {
      variant: "infoStudio",
      label: t("common.publishing"),
    },
    changesPending: {
      variant: "warningStudio",
      label: t("studio.overviewSection.globalStatus.changesPending"),
    },
    upToDate: { variant: "successStudio", label: t("common.upToDate") },
    error: { variant: "errorStudio", label: t("common.error") },
  } as const;

  const cfg = map[kind];

  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

PublicationStatusBadge.displayName = "PublicationStatusBadge";
