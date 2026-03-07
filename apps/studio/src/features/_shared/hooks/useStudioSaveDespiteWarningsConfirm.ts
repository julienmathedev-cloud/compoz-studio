"use client";

/**
 * @file apps/studio/src/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm.ts
 * @layer hooks/studio/shared
 *
 * @description
 * Hook partagé pour confirmer une sauvegarde Studio malgré des warnings non bloquants.
 *
 * @remarks
 * - Strictement UI-only.
 * - Traduit les warnings via un préfixe i18n métier fourni par l’appelant.
 * - Réutilise la confirmation partagée `studio.shared.confirm.saveDespiteWarnings.*`.
 * - Retourne `true` si la sauvegarde peut continuer, sinon `false`.
 */

import { useCallback } from "react";
import { useTranslations } from "next-intl";

import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";

type UseStudioSaveDespiteWarningsConfirmResult = Readonly<{
  confirmSaveDespiteWarnings: <TWarningKey extends string>(
    warningKeys: readonly TWarningKey[],
    warningMessageKeyPrefix: string,
  ) => Promise<boolean>;
}>;

export function useStudioSaveDespiteWarningsConfirm(): UseStudioSaveDespiteWarningsConfirmResult {
  const confirmList = useConfirmList();
  const t = useTranslations();

  const confirmSaveDespiteWarnings = useCallback(
    async <TWarningKey extends string>(
      warningKeys: readonly TWarningKey[],
      warningMessageKeyPrefix: string,
    ): Promise<boolean> => {
      const warningHints = warningKeys.map((key) =>
        t(`${warningMessageKeyPrefix}.${String(key)}`),
      );

      if (warningHints.length === 0) {
        return true;
      }

      return confirmList({
        title: t("studio.shared.confirm.saveDespiteWarnings.title"),
        intro: t("studio.shared.confirm.saveDespiteWarnings.intro"),
        items: warningHints,
        confirmLabel: t(
          "studio.shared.confirm.saveDespiteWarnings.confirmLabel",
        ),
        cancelLabel: t("common.cancel"),
        requireAckLabel: t(
          "studio.shared.confirm.saveDespiteWarnings.requireAckLabel",
        ),
        tone: "default",
      });
    },
    [confirmList, t],
  );

  return {
    confirmSaveDespiteWarnings,
  };
}

useStudioSaveDespiteWarningsConfirm.displayName =
  "useStudioSaveDespiteWarningsConfirm";
