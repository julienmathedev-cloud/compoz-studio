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
 * - Retourne la valeur canonique côté thème : `ThemeFontId | null`.
 * - `null` représente l’option “même police que le texte”.
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
