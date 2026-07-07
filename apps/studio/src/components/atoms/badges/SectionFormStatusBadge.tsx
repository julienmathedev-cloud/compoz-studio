/**
 * @file apps/studio/src/components/atoms/badges/SectionFormStatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Section form status badge for none, modified, saved, saving, and error states.
 */

import { useTranslations } from "next-intl";

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";

export type SectionFormStatusKind =
  | "none"
  | "modified"
  | "saved"
  | "saving"
  | "error";

export type SectionFormStatusBadgeProps = Readonly<{
  kind: SectionFormStatusKind;
  /** Error count, only used when `kind` is `"error"`. */
  count?: number;
}>;

export function SectionFormStatusBadge({
  kind,
  count = 0,
}: SectionFormStatusBadgeProps) {
  const t = useTranslations();

  if (kind === "none") return null;

  if (kind === "error") {
    const label =
      count === 1
        ? t("common.oneError", { count })
        : t("common.multipleErrors", { count });

    return <StatusBadge variant="error" label={label} />;
  }

  const map = {
    modified: { variant: "warning", label: t("common.modified") },
    saved: { variant: "success", label: t("common.saved") },
    saving: { variant: "info", label: t("common.saving") },
  } as const;

  const cfg = map[kind];

  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

SectionFormStatusBadge.displayName = "SectionFormStatusBadge";
