"use client";

/**
 * @file apps/ui/src/components/ui/confirmation/ConfirmationDialog.tsx
 * @layer ui/components
 *
 * @description
 * Composition UI pour les dialogues de confirmation : texte d’introduction optionnel
 * + liste de warnings/hints via `HintList`.
 *
 * @remarks
 * - Le rendu est purement présentational.
 * - La tonalité visuelle est pilotée par `variant`.
 */

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import type { ReactNode } from "react";

export type ConfirmHintListDescriptionProps = Readonly<{
  /** Intro optionnelle (contenu déjà rédigé). */
  intro?: ReactNode;
  /** Liste de hints/warnings (textes ou JSX). */
  hints: ReadonlyArray<ReactNode>;
  /** Tonalité visuelle (`info`/`warning`/`success`/`error`). */
  variant?: "info" | "warning" | "success" | "error";
}>;

/**
 * Rend une intro optionnelle suivie d’une liste de hints.
 */
export function ConfirmHintListDescription({
  intro,
  hints,
  variant = "info",
}: ConfirmHintListDescriptionProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Intro optionnelle. */}
      {intro ? (
        <Text as="p" className="text-sm">
          {intro}
        </Text>
      ) : null}

      {/* Liste de hints. */}
      <HintList hints={hints} variant={variant} className="mt-2" />
    </div>
  );
}
