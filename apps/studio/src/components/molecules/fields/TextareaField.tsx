"use client";

/**
 * @file apps/studio/src/components/molecules/fields/TextareaField.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Controlled Studio textarea field with label, help text, error display, and optional counter.
 *
 * @remarks
 * - Composes `Field`, `Textarea`, `FieldMetaBar`, and `ErrorText`.
 * - The value is fully controlled through `value` and `onChange`.
 * - Maps `error` and `invalid` to ARIA invalid state and visual styles.
 * - The optional counter is non-blocking and uses `maxLength` when provided.
 * - Loading state is handled by parent forms or sections; this component only handles `disabled`.
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
 * Hides native props that would bypass the controlled field contract.
 *
 * @remarks
 * - `id` comes from `ids.fieldId`.
 * - `value` and `onChange` are controlled by the parent.
 */
export type TextareaFieldProps = Readonly<
  Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "id" | "value" | "onChange" | "placeholder" | "rows" | "disabled"
  > & {
    ids: FieldIds;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    help?: string | ReactNode;
    error?: string;
    invalid?: boolean;
    disabled?: boolean;
    showCount?: boolean;
  }
>;

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
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {label}
      </FieldLabel>

      <Textarea
        id={fieldId}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
        aria-invalid={isInvalid ? true : undefined}
        disabled={disabled}
        variant="default"
        visualMode="studio"
        {...textareaProps}
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

TextareaField.displayName = "TextareaField";
