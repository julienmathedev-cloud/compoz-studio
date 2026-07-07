"use client";

/**
 * @file apps/studio/src/components/molecules/fields/SelectField.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Controlled Studio select field with label, help text, error display, and placeholder support.
 *
 * @remarks
 * - Composes `Field`, `Select`, `FieldMetaBar`, and `ErrorText`.
 * - The value is fully controlled through `value` and `onChange`.
 * - Maps `error` and `invalid` to ARIA invalid state and visual styles.
 * - Loading state is handled by parent forms or sections; this component only handles `disabled`.
 * - Supports custom trigger rendering through `renderValue`.
 */

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ErrorText } from "@compoz/studio/components/atoms/typography/ErrorText";
import { FieldMetaBar } from "@compoz/studio/components/molecules/fields/FieldMetaBar";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@compoz/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@compoz/ui/components/ui/select";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";

/** Select option accepted by `SelectField`. */
type SelectOption = Readonly<{
  label: ReactNode;
  /** Optional plain-text label for stable ARIA, search, or analytics usage. */
  textLabel?: string;
  value: string;
}>;

/**
 * Hides native select details behind Radix while keeping the field fully controlled.
 */
type SelectFieldProps = Readonly<{
  ids: FieldIds;
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: ReadonlyArray<SelectOption>;
  placeholder?: string;
  help?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
  renderValue?: (item: SelectOption) => ReactNode;
}>;

export function SelectField({
  ids,
  name,
  label,
  value,
  onChange,
  items,
  placeholder,
  help,
  error,
  invalid,
  disabled,
  renderValue,
}: SelectFieldProps) {
  const t = useTranslations();

  const computedPlaceholder = placeholder ?? t("common.selectPlaceholder");

  const { fieldId, helpId, errorId } = ids;

  const isInvalid = Boolean(error) || Boolean(invalid);

  const describedByIds: string[] = [];
  if (help && helpId) describedByIds.push(helpId);
  if (error && errorId) describedByIds.push(errorId);

  const describedBy =
    describedByIds.length > 0 ? describedByIds.join(" ") : undefined;

  const selected = items.find((it) => it.value === value);

  return (
    <Field data-invalid={isInvalid || undefined} className="min-w-0">
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {label}
      </FieldLabel>

      <Select
        name={name}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          visualMode="studio"
          aria-describedby={describedBy}
          aria-invalid={isInvalid ? true : undefined}
        >
          {renderValue && selected ? (
            <span>{renderValue(selected)}</span>
          ) : (
            <SelectValue placeholder={computedPlaceholder} />
          )}
        </SelectTrigger>

        <SelectContent visualMode="studio">
          {items.map((it) => (
            <SelectItem key={it.value} value={it.value} visualMode="studio">
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {help && (
        <FieldDescription visualMode="studio">
          <FieldMetaBar text={help} textId={helpId} />
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

SelectField.displayName = "SelectField";
