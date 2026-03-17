"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemeFontSelectField.tsx
 * @layer studio/molecules
 *
 * @description
 * Champ Select dédié au choix de la police du thème public.
 *
 * @remarks
 * - S’appuie sur `SelectField`.
 * - Consomme les options UI construites depuis la source de vérité `theme-fonts`.
 * - Retourne la valeur canonique côté thème : `ThemeFontId`.
 */

import type { ThemeFontId } from "@compoz/core/constants/theme/theme-fonts";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { buildThemeFontSelectItems } from "@compoz/studio/features/settings/theme/theme-font-select-items";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";

type ThemeFontSelectFieldProps = Readonly<{
  ids: FieldIds;
  label: string;
  value: string;
  onChange: (value: ThemeFontId) => void;
  placeholder?: string;
  help?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
}>;

const FONT_ITEMS = buildThemeFontSelectItems();

export function ThemeFontSelectField({
  ids,
  label,
  value,
  onChange,
  placeholder,
  help,
  error,
  invalid,
  disabled,
}: ThemeFontSelectFieldProps) {
  return (
    <SelectField
      ids={ids}
      label={label}
      value={value}
      onChange={(nextValue) => onChange(nextValue as ThemeFontId)}
      items={FONT_ITEMS}
      placeholder={placeholder}
      help={help}
      error={error}
      invalid={invalid}
      disabled={disabled}
      renderValue={(item) => item.label}
    />
  );
}

ThemeFontSelectField.displayName = "ThemeFontSelectField";
