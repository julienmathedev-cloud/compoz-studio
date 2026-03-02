"use client";

/**
 * @file apps/studio/src/components/molecules/fields/FieldMetaBar.tsx
 * @layer ui/molecules
 *
 * @description
 * Barre méta affichée sous un champ (texte à gauche, compteur à droite).
 *
 * @remarks
 * - Molecule UI : compose l’atome `Text`.
 * - Utilisée pour afficher des informations contextuelles non bloquantes.
 * - Le compteur est purement informatif (`aria-hidden`).
 * - Ne rend rien si aucun contenu n’est fourni.
 * - Strictement UI-only : aucune logique métier.
 */

import { HelpText } from "@compoz/studio/components/atoms/typography/HelpText";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN } from "@compoz/ui/styles/studio/layout";
import type { ReactNode } from "react";

/**
 * Props du composant `FieldMetaBar`.
 */
export type FieldMetaBarProps = Readonly<{
  /** Texte ou JSX affiché à gauche. */
  text?: string | ReactNode;
  /** Identifiant optionnel associé au texte (ARIA / a11y). */
  textId?: string;

  /** Valeur numérique affichée dans le compteur. */
  count?: number;
  /** Valeur maximale utilisée pour le format `count/max`. */
  max?: number;
}>;

/**
 * Affiche une barre méta sous un champ de formulaire (admin).
 */
export function FieldMetaBar({ text, textId, count, max }: FieldMetaBarProps) {
  const hasCounter = typeof count === "number";
  const counterText =
    hasCounter && typeof max === "number"
      ? `${count}/${max}`
      : hasCounter
        ? `${count}`
        : null;

  if (!text && !counterText) return null;

  return (
    <span className={cn(ROW_BETWEEN)}>
      {text ? (
        <HelpText as="span" id={textId}>
          {text}
        </HelpText>
      ) : (
        <span />
      )}

      {counterText && (
        <HelpText as="span" aria-hidden className="tabular-nums">
          {counterText}
        </HelpText>
      )}
    </span>
  );
}

FieldMetaBar.displayName = "FieldMetaBar";
