"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemeFontSelectField.tsx
 * @layer studio/features/settings/theme
 *
 * @description
 * Theme font select field backed by the shared theme font registry.
 *
 * @remarks
 * - Stores canonical `ThemeFontId | null` values in the form state.
 * - `null` means the heading font should inherit the body font, so the select uses a sentinel option internally.
 */

import type { ThemeFontId } from "@compoz/core/constants/theme/theme-fonts";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { buildThemeFontSelectItems } from "@compoz/studio/features/settings/theme/theme-font-select-items";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";

type ThemeFontSelectFieldProps = Readonly<{
  ids: FieldIds;
  name?: string;
  label: string;
  value: ThemeFontId | null;
  onChange: (value: ThemeFontId | null) => void;
  fallbackLabel?: string;
  placeholder?: string;
  help?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
}>;

const FONT_ITEMS = buildThemeFontSelectItems();
// SelectField needs a string value, while the theme form stores this option as `null`.
const SAME_AS_BODY_VALUE = "__same-as-body__";

export function ThemeFontSelectField({
  ids,
  name,
  label,
  value,
  onChange,
  fallbackLabel,
  placeholder,
  help,
  error,
  invalid,
  disabled,
}: ThemeFontSelectFieldProps) {
  const items = fallbackLabel
    ? [
        {
          value: SAME_AS_BODY_VALUE,
          label: fallbackLabel,
          textLabel: fallbackLabel,
        },
        ...FONT_ITEMS,
      ]
    : FONT_ITEMS;

  return (
    <SelectField
      ids={ids}
      name={name}
      label={label}
      value={value ?? SAME_AS_BODY_VALUE}
      onChange={(nextValue) =>
        onChange(
          nextValue === SAME_AS_BODY_VALUE ? null : (nextValue as ThemeFontId),
        )
      }
      items={items}
      placeholder={placeholder}
      help={help}
      error={error}
      invalid={invalid}
      disabled={disabled}
    />
  );
}

ThemeFontSelectField.displayName = "ThemeFontSelectField";
