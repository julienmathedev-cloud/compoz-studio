"use client";

/**
 * @file apps/studio/src/features/settings/social/components/molecules/NewSocialLinkField.tsx
 * @layer ui/studio/molecules
 *
 * @description
 * Champ texte contrôlé pour lien social (email / URL) avec préfixe figé via `InputGroup`.
 *
 * @remarks
 * - La valeur contrôlée (`value`) correspond uniquement à la partie variable (sans préfixe).
 * - Le préfixe est dérivé de `isEmail` : `mailto:` ou `https://`.
 * - Le parent reconstruit la valeur canonique (préfixe + valeur) et pilote la validation (RHF, trigger, etc.).
 * - Sur Enter, le composant évite le submit et déclenche `onBlur` (point de validation).
 * - UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import type {
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  KeyboardEvent,
} from "react";

import { ErrorText } from "@compoz/studio/components/atoms/typography/ErrorText";
import { FieldMetaBar } from "@compoz/studio/components/molecules/fields/FieldMetaBar";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@compoz/ui/components/ui/field";

import {
  InputGroup,
  InputGroupInput,
  InputGroupText,
} from "@compoz/ui/components/ui/input-group";

import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";

/**
 * Props du composant `NewSocialLinkField`.
 */
type NewSocialLinkFieldProps = Readonly<{
  /** Ensemble des IDs ARIA du champ (fournis par le parent). */
  ids: FieldIds;
  name?: string;

  /** Mode email (`mailto:`) si `true`, sinon URL (`https://`). */
  isEmail: boolean;

  /** Valeur affichée (partie variable, sans préfixe). */
  value: string;

  /** Callback de mise à jour de la valeur affichée (sans préfixe). */
  onChange: (value: string) => void;

  /** Callback optionnel au blur (point de validation côté parent). */
  onBlur?: () => void;

  /** Hook optionnel pour compléter le `keyDown` (après la gestion interne). */
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;

  /** Indicateur visuel/ARIA d’invalidité (complète `error`). */
  invalid?: boolean;

  /** Message d’erreur bloquant affiché sous le champ. */
  error?: string;

  /** Désactive le champ et l’interaction. */
  disabled?: boolean;

  /** Placeholder spécifique pour le mode email. */
  placeholderEmail?: string;

  /** Placeholder spécifique pour le mode URL. */
  placeholderUrl?: string;

  /** Texte d’aide pour le mode email. */
  helpEmail?: string;

  /** Texte d’aide pour le mode URL. */
  helpUrl?: string;
}>;

/**
 * Champ de saisie d’un lien social avec préfixe figé (studio).
 */
export function NewSocialLinkField({
  ids,
  name,
  isEmail,
  value,
  onChange,
  onBlur,
  onKeyDown,
  invalid,
  error,
  disabled,
  placeholderEmail,
  placeholderUrl,
  helpEmail,
  helpUrl,
}: NewSocialLinkFieldProps) {
  const t = useTranslations();

  const { fieldId, helpId, errorId } = ids;

  const prefix = isEmail ? "mailto:" : "https://";

  const inputType: HTMLInputTypeAttribute = isEmail ? "email" : "url";

  const inputMode: InputHTMLAttributes<HTMLInputElement>["inputMode"] = isEmail
    ? "email"
    : "url";

  const placeholder = isEmail ? placeholderEmail : placeholderUrl;
  const help = isEmail ? helpEmail : helpUrl;

  const isInvalid = Boolean(error) || Boolean(invalid);

  const describedByIds: string[] = [];

  if (help && helpId) describedByIds.push(helpId);
  if (error && errorId) describedByIds.push(errorId);

  const describedBy =
    describedByIds.length > 0 ? describedByIds.join(" ") : undefined;

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onBlur?.();
    }

    onKeyDown?.(e);
  }

  return (
    <Field data-invalid={isInvalid || undefined} className="min-w-0">
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {t("studio.socialLinkField.label")}
      </FieldLabel>

      <InputGroup visualMode="studio" className="pl-2">
        <InputGroupText>{prefix}</InputGroupText>

        <InputGroupInput
          id={fieldId}
          name={name}
          type={inputType}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          aria-invalid={isInvalid ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          visualMode="studio"
          className="pl-0.5"
        />
      </InputGroup>

      {help && (
        <FieldDescription visualMode="studio">
          <FieldMetaBar text={help} textId={helpId} />
        </FieldDescription>
      )}

      {error ? (
        <FieldError id={errorId}>
          <ErrorText error={error} />
        </FieldError>
      ) : null}
    </Field>
  );
}

NewSocialLinkField.displayName = "NewSocialLinkField";
