"use client";

/**
 * @file apps/studio/src/components/molecules/fields/TextareaField.tsx
 * @layer studio/molecules
 *
 * @description
 * Champ textarea contrôlé (label, aide, erreur, compteur) basé sur le composant `Field`.
 *
 * @remarks
 * - Molecule UI : compose `Field`, `Textarea`, `FieldMetaBar` et `ErrorText`.
 * - Contrôle via `value` / `onChange` fournis par le parent.
 * - L’invalidité est pilotée via `error` et/ou `invalid` (ARIA + styles).
 * - Le compteur est non bloquant et utilise `maxLength` si fourni.
 * - Le chargement est géré au niveau Form / Section (ce composant ne gère que `disabled`).
 * - Strictement UI-only : aucune logique métier.
 */

import type { ReactNode, TextareaHTMLAttributes } from "react";

import { ErrorText } from "@compoz/studio/components/atoms/typography/ErrorText";
import { FieldMetaBar } from "@compoz/studio/components/molecules/fields/FieldMetaBar";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@compoz/ui/components/ui/field";
import { Textarea } from "@compoz/ui/components/ui/textarea";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";

/**
 * Props du composant `TextareaField`.
 *
 * @remarks
 * Certaines props natives sont masquées pour imposer une API contrôlée :
 * - `id` est fourni via `ids.fieldId`.
 * - `value` / `onChange` sont contrôlés par le parent.
 */
export type TextareaFieldProps = Readonly<
  Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "id" | "value" | "onChange" | "placeholder" | "rows" | "disabled"
  > & {
    /** Ensemble des IDs ARIA du champ (fournis par le parent). */
    ids: FieldIds;
    /** Libellé visible associé au textarea. */
    label: string;
    /** Valeur actuelle (contrôlée). */
    value: string;
    /** Callback appelé avec la prochaine valeur. */
    onChange: (v: string) => void;
    /** Placeholder optionnel. */
    placeholder?: string;
    /** Nombre de lignes visibles par défaut. */
    rows?: number;
    /** Texte d’aide optionnel (string ou JSX). */
    help?: string | ReactNode;
    /** Message d’erreur bloquant affiché sous le champ. */
    error?: string;
    /** Indicateur visuel/ARIA d’invalidité (complète `error`). */
    invalid?: boolean;
    /** Désactive l’input. */
    disabled?: boolean;
    /** Affiche le compteur de caractères (non bloquant). */
    showCount?: boolean;
  }
>;

/**
 * Champ textarea contrôlé standardisé pour le Studio.
 */
export function TextareaField({
  ids,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  help,
  error,
  invalid,
  disabled,
  showCount = false,
  ...textareaProps
}: TextareaFieldProps) {
  const { fieldId, helpId, errorId } = ids;

  const max =
    typeof textareaProps.maxLength === "number"
      ? textareaProps.maxLength
      : undefined;

  const isInvalid = Boolean(error) || Boolean(invalid);

  // A11y : aria-describedby construit à partir des IDs fournis + contenu présent
  const describedByIds: string[] = [];

  if (help && helpId) {
    describedByIds.push(helpId);
  }

  if (error && errorId) {
    describedByIds.push(errorId);
  }

  const describedBy =
    describedByIds.length > 0 ? describedByIds.join(" ") : undefined;

  return (
    <Field data-invalid={isInvalid || undefined}>
      {/* Label principal */}
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {label}
      </FieldLabel>

      {/* Contrôle principal */}
      <Textarea
        id={fieldId}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
        aria-invalid={isInvalid ? true : undefined}
        disabled={disabled}
        variant="defaultStudio"
        {...textareaProps}
      />

      {/* Aide + compteur (non bloquants) */}
      {(help || showCount) && (
        <FieldDescription visualMode="studio">
          <FieldMetaBar
            text={help}
            textId={helpId}
            count={showCount ? value.length : undefined}
            max={max}
          />
        </FieldDescription>
      )}

      {/* Erreur bloquante */}
      {error && (
        <FieldError id={errorId}>
          <ErrorText error={error} />
        </FieldError>
      )}
    </Field>
  );
}

TextareaField.displayName = "TextareaField";
