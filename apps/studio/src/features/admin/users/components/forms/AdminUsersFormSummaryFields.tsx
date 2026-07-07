"use client";

/**
 * @file apps/studio/src/features/admin/users/components/forms/AdminUsersFormSummaryFields.tsx
 * @layer studio/features/admin/users/components/forms
 *
 * @description
 * Summary fields section for the Studio user form: email, name, and password.
 *
 * @remarks
 * - Uses RHF `Controller` for controlled field binding.
 * - Error states are provided by the parent form shell.
 */

import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";

import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import type { UserFormValues } from "@compoz/validation/users/user-form";

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";

type FieldErrorState = Readonly<{ invalid: boolean; message?: string }>;

type AdminUsersFormSummaryFieldsProps = Readonly<{
  mode: "create" | "edit";
  isBusy: boolean;
  control: Control<UserFormValues>;

  emailIds: FieldIds;
  nameIds: FieldIds;
  passwordIds: FieldIds;

  emailState: FieldErrorState;
  nameState: FieldErrorState;
  passwordState: FieldErrorState;
}>;

export function AdminUsersFormSummaryFields({
  mode,
  isBusy,
  control,
  emailIds,
  nameIds,
  passwordIds,
  emailState,
  nameState,
  passwordState,
}: AdminUsersFormSummaryFieldsProps) {
  const t = useTranslations();

  const isEdit = mode === "edit";

  const passwordHelp = isEdit
    ? t("studio.users.form.password.helpEdit")
    : t("studio.users.form.password.helpCreate");

  const safePasswordHelp =
    passwordHelp ||
    (isEdit
      ? t("studio.users.form.password.helpEditFallback")
      : t("studio.users.form.password.helpCreateFallback"));

  return (
    <FormGrid>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <InputField
            ids={emailIds}
            name={field.name}
            inputRef={field.ref}
            label={t("studio.users.form.email.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={() => field.onBlur()}
            placeholder={
              isEdit
                ? t("studio.users.form.email.placeholderEdit")
                : t("studio.users.form.email.placeholderCreate")
            }
            help={t("studio.users.form.email.help")}
            required
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isBusy}
            invalid={emailState.invalid}
            error={emailState.message}
          />
        )}
      />

      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <InputField
            ids={nameIds}
            name={field.name}
            inputRef={field.ref}
            label={t("studio.users.form.name.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            placeholder={
              isEdit
                ? t("studio.users.form.name.placeholderEdit")
                : t("studio.users.form.name.placeholderCreate")
            }
            help={t("studio.users.form.name.help")}
            required
            autoComplete="name"
            autoCapitalize="words"
            spellCheck={false}
            disabled={isBusy}
            invalid={nameState.invalid}
            error={nameState.message}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <InputField
            ids={passwordIds}
            name={field.name}
            inputRef={field.ref}
            label={t("studio.users.form.password.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            placeholder={
              isEdit
                ? t("studio.users.form.password.placeholderEdit")
                : t("studio.users.form.password.placeholderCreate")
            }
            help={safePasswordHelp}
            type="password"
            autoComplete={isEdit ? "new-password" : "new-password"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isBusy}
            invalid={passwordState.invalid}
            error={passwordState.message}
          />
        )}
      />
    </FormGrid>
  );
}

AdminUsersFormSummaryFields.displayName = "AdminUsersFormSummaryFields";
