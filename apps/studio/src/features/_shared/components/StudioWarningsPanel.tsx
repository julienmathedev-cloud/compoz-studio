"use client";

/**
 * @file apps/studio/src/features/_shared/components/StudioWarningsPanel.tsx
 * @layer ui/studio/shared/settings
 *
 * @description
 * Panneau réutilisable d’affichage des warnings non bloquants d’une section settings Studio.
 *
 * @remarks
 * - Strictement UI-only.
 * - Traduit les warnings via un préfixe de clés métier fourni par le parent.
 * - Délègue le rendu du panneau expansible à `StudioHintsPanel`.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { StudioHintsPanel } from "@compoz/studio/features/_shared/components/StudioHintsPanel";

type StudioWarningsPanelProps<TWarningKey extends string> = Readonly<{
  /** ID DOM stable du panneau expansible. */
  id: string;

  /** Liste des warnings métier à afficher. */
  warningKeys: readonly TWarningKey[];

  /**
   * Préfixe i18n métier des warnings.
   *
   * @example
   * - "studio.footerSection.warnings"
   * - "studio.headerSection.warnings"
   */
  warningMessageKeyPrefix: string;
}>;

export function StudioWarningsPanel<TWarningKey extends string>({
  id,
  warningKeys,
  warningMessageKeyPrefix,
}: StudioWarningsPanelProps<TWarningKey>) {
  const t = useTranslations();

  const warningHints = useMemo(
    () =>
      warningKeys.map((key) => t(`${warningMessageKeyPrefix}.${String(key)}`)),
    [warningKeys, warningMessageKeyPrefix, t],
  );

  return (
    <StudioHintsPanel id={id} hints={warningHints} variant="warningStudio" />
  );
}

StudioWarningsPanel.displayName = "StudioWarningsPanel";
