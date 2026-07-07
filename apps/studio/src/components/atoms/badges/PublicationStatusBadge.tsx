/**
 * @file apps/studio/src/components/atoms/badges/PublicationStatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Publication status badge for published, never, publishing, changes pending,
 * up-to-date, and error states.
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
      variant: "success",
      label: t("common.published"),
    },
    never: {
      variant: "info",
      label: t("studio.overviewSection.globalStatus.never"),
    },
    publishing: {
      variant: "info",
      label: t("common.publishing"),
    },
    changesPending: {
      variant: "warning",
      label: t("studio.overviewSection.globalStatus.changesPending"),
    },
    upToDate: { variant: "success", label: t("common.upToDate") },
    error: { variant: "error", label: t("common.error") },
  } as const;

  const cfg = map[kind];

  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

PublicationStatusBadge.displayName = "PublicationStatusBadge";
