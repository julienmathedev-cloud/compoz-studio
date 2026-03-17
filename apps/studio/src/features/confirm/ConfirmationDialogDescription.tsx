"use client";

/**
 * @file apps/studio/src/features/confirm/components/ConfirmationDialogDescription.tsx
 * @layer ui/molecules
 *
 * @description
 * Composition UI pour les dialogues de confirmation : texte d’introduction optionnel
 * + liste de warnings/hints via `HintList`.
 *
 * @remarks
 * - Le rendu est purement présentational.
 * - La tonalité visuelle est pilotée par `variant`.
 */

import type { ReactNode } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";

type Variant = "infoStudio" | "warningStudio" | "successStudio" | "errorStudio";

export type ConfirmationDialogProps = Readonly<{
  /** Intro optionnelle (contenu déjà rédigé). */
  intro?: ReactNode;
  /** Liste de hints/warnings (textes ou JSX). */
  hints: ReadonlyArray<ReactNode>;
  /** Tonalité visuelle (`info`/`warning`/`success`/`error`). */
  variant?: Variant;
}>;

/**
 * Rend une intro optionnelle suivie d’une liste de hints.
 */
export function ConfirmationDialogDescription({
  intro,
  hints,
  variant = "infoStudio",
}: ConfirmationDialogProps) {
  return (
    <div className="flex flex-col gap-2">
      {intro ? (
        <Text as="p" className="text-sm">
          {intro}
        </Text>
      ) : null}

      <HintList hints={hints} variant={variant} className="mt-2" />
    </div>
  );
}

ConfirmationDialogDescription.displayName = "ConfirmationDialogDescription";
