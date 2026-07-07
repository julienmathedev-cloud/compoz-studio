"use client";

/**
 * @file apps/studio/src/components/molecules/fields/InputField.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Controlled Studio text field with label, help text, error display, and optional counter.
 *
 * @remarks
 * - Composes `Field`, `Input`, `FieldMetaBar`, and `ErrorText`.
 * - The value is fully controlled through `value` and `onChange`.
 * - Maps `error` and `invalid` to ARIA invalid state and visual styles.
 * - The optional counter is non-blocking and uses `maxLength` when provided.
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
 * Hides native props that would bypass the controlled field contract.
 *
 * @remarks
 * - `id` comes from `ids.fieldId`.
 * - `value` and `onChange` are controlled by the parent.
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
