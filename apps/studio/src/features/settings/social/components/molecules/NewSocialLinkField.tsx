"use client";

/**
 * @file apps/studio/src/features/settings/social/components/molecules/NewSocialLinkField.tsx
 * @layer studio/features/settings/social/components/molecules
 *
 * @description
 * Controlled social link input with a fixed email or URL prefix.
 *
 * @remarks
 * - The controlled value contains only the editable part, without `mailto:` or `https://`.
 * - The parent rebuilds the canonical value and owns validation through RHF/trigger.
 * - Enter is treated like a blur so the parent can validate without submitting the form.
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

type NewSocialLinkFieldProps = Readonly<{
  ids: FieldIds;
  name?: string;
  isEmail: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  invalid?: boolean;
  error?: string;
  disabled?: boolean;
  placeholderEmail?: string;
  placeholderUrl?: string;
  helpEmail?: string;
  helpUrl?: string;
}>;

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
