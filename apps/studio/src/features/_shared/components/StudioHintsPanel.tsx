"use client";

/**
 * @file apps/studio/src/features/_shared/components/StudioHintsPanel.tsx
 * @layer ui/studio/shared/settings
 *
 * @description
 * Panneau réutilisable d’affichage d’une liste de messages Studio
 * dans un bloc expansible.
 *
 * @remarks
 * - Strictement UI-only.
 * - Ne traduit rien : il reçoit des `hints` déjà prêts à afficher.
 * - Réutilise les libellés partagés du panneau warnings (`studio.shared.warningsPanel.*`).
 * - Rend le panneau désactivé si aucun hint n’est présent.
 */

import { useTranslations } from "next-intl";

import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";

type StudioHintsPanelProps = Readonly<{
  /** ID DOM stable du panneau expansible. */
  id: string;

  /** Liste des messages à afficher. */
  hints: readonly string[];

  /**
   * Variante visuelle du panneau.
   * @default "warning"
   */
  variant?: "warningStudio" | "infoStudio";

  /**
   * Titre optionnel de la liste.
   * - Si absent : fallback sur `studio.shared.warningsPanel.title`.
   */
  title?: string;
}>;

export function StudioHintsPanel({
  id,
  hints,
  variant = "warningStudio",
  title,
}: StudioHintsPanelProps) {
  const t = useTranslations();

  const hasHints = hints.length > 0;

  return (
    <ExpandableLayout
      id={id}
      label={
        hasHints
          ? t("studio.shared.warningsPanel.labelWithCount", {
              count: hints.length,
            })
          : t("studio.shared.warningsPanel.label")
      }
      defaultOpen={false}
      disabled={!hasHints}
    >
      {hasHints ? (
        <HintList
          variant={variant}
          title={title ?? t("studio.shared.warningsPanel.title")}
          hints={hints}
        />
      ) : null}
    </ExpandableLayout>
  );
}

StudioHintsPanel.displayName = "StudioHintsPanel";
