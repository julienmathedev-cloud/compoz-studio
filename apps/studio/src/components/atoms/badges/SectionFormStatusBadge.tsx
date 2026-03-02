/**
 * @file apps/studio/src/components/atoms/badges/SectionFormStatusBadge.tsx
 * @layer ui/atoms
 *
 * @description
 * Badge de statut de section (saved/dirty/saving/error) à côté d’un formulaire.
 */

import { StatusBadge } from "@compoz/studio/components/atoms/badges/StatusBadge";
import { useTranslations } from "next-intl";

export type SectionFormStatusKind =
  | "none"
  | "modified"
  | "saved"
  | "saving"
  | "error";

export type SectionFormStatusBadgeProps = Readonly<{
  kind: SectionFormStatusKind;
  /** Nombre d’erreurs (uniquement pour kind="error"). */
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
    return <StatusBadge variant="destructive" label={label} />;
  }

  const map = {
    modified: { variant: "warning", label: t("common.modified") },
    saved: { variant: "success", label: t("common.saved") },
    saving: { variant: "info", label: t("common.saving") },
  } as const;

  const cfg = map[kind] ?? map.saved;
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

SectionFormStatusBadge.displayName = "SectionFormStatusBadge";
