"use client";

/**
 * @file apps/studio/src/features/confirm/useConfirmList.tsx
 * @layer hooks/confirm
 *
 * @description
 * Hook utilitaire exposant une variante de confirmation incluant une liste
 * d’éléments explicatifs (warnings, informations, points d’attention).
 *
 * @remarks
 * - Les contenus (`title`, `intro`, `items`) sont supposés déjà traduits.
 * - Repose sur `useConfirm()` et sur un rendu dédié de description.
 * - UI-only.
 */

import type { ReactNode } from "react";
import { useCallback } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ConfirmationDialogDescription } from "@compoz/studio/features/confirm/ConfirmationDialogDescription";
import { useConfirm } from "@compoz/studio/features/confirm/useConfirm";
import { cn } from "@compoz/ui/lib/utils";
import { TITLE_H3 } from "@compoz/ui/styles/studio/typography";

type ConfirmTone = "default" | "danger";

export type ConfirmListParams = Readonly<{
  /** Titre affiché dans la boîte de dialogue (déjà traduit). */
  title: ReactNode;
  /** Texte introductif optionnel (déjà traduit). */
  intro?: ReactNode;
  /** Liste d’éléments à afficher (warnings, détails, conséquences). */
  items: ReadonlyArray<ReactNode>;
  /** Libellé du bouton de confirmation. */
  confirmLabel: string;
  /** Libellé du bouton d’annulation. */
  cancelLabel: string;
  /** Si présent : exige une acknowledgment checkbox. */
  requireAckLabel?: string;
  /** Tonalité visuelle : défaut ou danger. */
  tone?: ConfirmTone;
}>;

export type UseConfirmList = (params: ConfirmListParams) => Promise<boolean>;

/**
 * Expose une fonction `confirmList(params)` retournant `Promise<boolean>`.
 */
export function useConfirmList(): UseConfirmList {
  const confirm = useConfirm();

  return useCallback(
    async ({
      title,
      intro,
      items,
      confirmLabel,
      cancelLabel,
      requireAckLabel,
      tone = "default",
    }: ConfirmListParams) => {
      return confirm({
        title: (
          <Text as="p" className={cn(TITLE_H3)}>
            {title}
          </Text>
        ),
        description: (
          <ConfirmationDialogDescription
            intro={intro}
            hints={items}
            variant="infoStudio"
          />
        ),
        confirmLabel,
        cancelLabel,
        tone,
        requireAcknowledge: requireAckLabel
          ? { label: requireAckLabel }
          : undefined,
      });
    },
    [confirm],
  );
}

useConfirmList.displayName = "useConfirmList";
