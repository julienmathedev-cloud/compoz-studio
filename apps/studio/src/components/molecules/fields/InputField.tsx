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
    ids: FieldIds;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: HTMLInputTypeAttribute;
    help?: string | ReactNode;
    error?: string;
    invalid?: boolean;
    disabled?: boolean;
    showCount?: boolean;
    inputRef?: Ref<HTMLInputElement>;
  }
>;

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

  const max =
    typeof inputProps.maxLength === "number" ? inputProps.maxLength : undefined;

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
    <Field data-invalid={isInvalid || undefined} className="min-w-0">
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {label}
      </FieldLabel>

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
        variant="default"
        visualMode="studio"
        {...inputProps}
      />

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

      {error && (
        <FieldError id={errorId}>
          <ErrorText error={error} />
        </FieldError>
      )}
    </Field>
  );
}

InputField.displayName = "InputField";
