"use client";

/**
 * @file apps/studio/src/components/molecules/fields/InputField.tsx
 * @layer studio/molecules
 *
 * @description
 * Champ texte contrôlé (label, aide, erreur, compteur) basé sur le composant `Field`.
 *
 * @remarks
 * - Molecule UI : compose `Field`, `Input`, `FieldMetaBar` et `ErrorText`.
 * - Contrôle via `value` / `onChange` fournis par le parent.
 * - Gère l’état d’invalidité via `error` et/ou `invalid` (ARIA + styles).
 * - Le compteur est non bloquant et utilise `maxLength` si fourni.
 * - Strictement UI-only : aucune logique métier.
 */

import type {
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  ReactNode,
  Ref,
} from "react";

import { ErrorText } from "@compoz/studio/components/atoms/typography/ErrorText";
import { FieldMetaBar } from "@compoz/studio/components/molecules/fields/FieldMetaBar";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@compoz/ui/components/ui/field";
import { Input } from "@compoz/ui/components/ui/input";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";

/**
 * Props du composant `InputField`.
 *
 * @remarks
 * Certaines props natives sont masquées pour imposer une API contrôlée :
 * - `id` est fourni via `ids.fieldId`.
 * - `value` / `onChange` sont contrôlés par le parent.
 */
export type InputFieldProps = Readonly<
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "type" | "placeholder" | "disabled"
  > & {
    /** Ensemble des IDs ARIA du champ (fournis par le parent). */
    ids: FieldIds;
    /** Libellé visible associé à l’input. */
    label: string;
    /** Valeur actuelle (contrôlée). */
    value: string;
    /** Callback appelé avec la prochaine valeur. */
    onChange: (v: string) => void;
    /** Placeholder optionnel. */
    placeholder?: string;
    /** Type d’input HTML (défaut: "text"). */
    type?: HTMLInputTypeAttribute;
    /** Texte d’aide optionnel (string ou JSX). */
    help?: string | ReactNode;
    /** Message d’erreur bloquant affiché sous le champ. */
    error?: string;
    /** Marque le champ invalide (complète `error`). */
    invalid?: boolean;
    /** Désactive l’input. */
    disabled?: boolean;
    /** Affiche le compteur de caractères (non bloquant). */
    showCount?: boolean;
    /** Ref optionnelle vers l’input (focus, RHF, etc.). */
    inputRef?: Ref<HTMLInputElement>;
  }
>;

/**
 * Champ texte contrôlé standardisé pour le Studio.
 */
export function InputField({
  ids,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  help,
  error,
  invalid,
  disabled,
  showCount = false,
  inputRef,
  ...inputProps
}: InputFieldProps) {
  const { fieldId, helpId, errorId } = ids;

  const isInvalid = Boolean(error) || Boolean(invalid);

  // Si maxLength est fourni, on le récupère pour alimenter le compteur
  const max =
    typeof inputProps.maxLength === "number" ? inputProps.maxLength : undefined;

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
    <Field
      // Permet de cibler visuellement le groupe (bordures, couleurs, etc.)
      data-invalid={isInvalid || undefined}
      className="min-w-0"
    >
      {/* Label accessible associé à l’input via htmlFor */}
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {label}
      </FieldLabel>

      {/* Contrôle principal : input contrôlé */}
      <Input
        id={fieldId}
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        variant="defaultStudio"
        {...inputProps}
      />

      {/* Description + barre meta (aide + compteur) */}
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

      {/* Erreur bloquante sous le champ */}
      {error && (
        <FieldError id={errorId}>
          <ErrorText error={error} />
        </FieldError>
      )}
    </Field>
  );
}

InputField.displayName = "InputField";
