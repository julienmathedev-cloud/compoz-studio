"use client";

/**
 * @file apps/studio/src/features/confirm/useConfirmList.tsx
 * @layer hooks/shared
 *
 * @description
 * Hook utilitaire exposant une variante de confirmation incluant une liste
 * d’éléments explicatifs (warnings, informations, points d’attention).
 *
 * @remarks
 * - Les contenus (`title`, `intro`, `items`) sont supposés déjà traduits.
 * - Repose sur `useConfirm()` et sur un rendu dédié de description.
 */

import { cn } from "@compoz/ui/lib/utils";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ConfirmHintListDescription } from "@compoz/studio/features/confirm/ConfirmHintListDescription";
import { useConfirm } from "@compoz/studio/features/confirm/useConfirm";
import { TITLE_H3 } from "@compoz/ui/styles/studio/typography";
import type { ReactNode } from "react";

type ConfirmListParams = {
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
  tone?: "default" | "danger";
};

/**
 * Expose une fonction `confirmList(params)` retournant `Promise<boolean>`.
 */
export function useConfirmList() {
  const confirm = useConfirm(); // Injecte la fonction du provider global

  return async function confirmList({
    title,
    intro,
    items,
    confirmLabel,
    cancelLabel,
    requireAckLabel,
    tone = "default",
  }: ConfirmListParams): Promise<boolean> {
    return confirm({
      title: (
        <Text as="p" className={cn(TITLE_H3)}>
          {title}
        </Text>
      ),
      description: (
        <ConfirmHintListDescription
          intro={intro}
          hints={items}
          variant="info"
        />
      ),
      confirmLabel,
      cancelLabel,
      tone,
      requireAcknowledge: requireAckLabel
        ? { label: requireAckLabel }
        : undefined,
    });
  };
}
