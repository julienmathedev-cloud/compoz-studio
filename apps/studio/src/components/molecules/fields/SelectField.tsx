"use client";

/**
 * @file apps/studio/src/components/molecules/fields/SelectField.tsx
 * @layer studio/molecules
 *
 * @description
 * Champ Select contrôlé (label, aide, erreur, placeholder) basé sur le Select ShadCN.
 *
 * @remarks
 * - Molecule UI : compose `Field`, `Select` et des atoms (`FieldMetaBar`, `ErrorText`).
 * - Contrôle via `value` / `onChange` fournis par le parent.
 * - L’invalidité est pilotée via `error` et/ou `invalid` (ARIA + styles).
 * - Le chargement est géré au niveau Form / Section (ce composant ne gère que `disabled`).
 * - Supporte un rendu custom du trigger via `renderValue`.
 * - Strictement UI-only : aucune logique métier.
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

/**
 * Option d’un `SelectField`.
 */
type SelectOption = Readonly<{
  /** Label affiché dans la liste (string ou JSX). */
  label: ReactNode;
  /** Label texte optionnel (fallback stable : aria, recherche, analytics). */
  textLabel?: string;
  value: string;
}>;

/**
 * Props du composant `SelectField`.
 */
type SelectFieldProps = Readonly<{
  /** Ensemble des IDs ARIA du champ (fournis par le parent). */
  ids: FieldIds;
  /** Nom du champ pour le select natif caché généré par Radix. */
  name?: string;
  /** Libellé visible associé au Select. */
  label: string;
  /** Valeur actuelle sélectionnée (contrôlée). */
  value: string;
  /** Callback appelé avec la prochaine valeur sélectionnée. */
  onChange: (v: string) => void;
  /** Liste des options disponibles. */
  items: ReadonlyArray<SelectOption>;
  /** Placeholder optionnel (fallback i18n si absent). */
  placeholder?: string;
  /** Texte d’aide optionnel affiché sous le champ. */
  help?: string;
  /** Message d’erreur bloquant affiché sous le champ. */
  error?: string;
  /** Indicateur visuel/ARIA d’invalidité (complète `error`). */
  invalid?: boolean;
  /** Désactive toute interaction. */
  disabled?: boolean;
  /** Rendu custom dans le trigger (valeur sélectionnée). */
  renderValue?: (item: SelectOption) => ReactNode;
}>;

/**
 * Champ Select contrôlé standardisé pour le Studio.
 */
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
