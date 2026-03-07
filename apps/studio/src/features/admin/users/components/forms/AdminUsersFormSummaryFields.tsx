"use client";

/**
 * @file apps/studio/src/features/admin/users/components/forms/AdminUsersFormSummaryFields.tsx
 * @layer ui/organisms
 *
 * @description
 * Section “summary” du formulaire Users : email / name / password.
 *
 * @remarks
 * - Strictement UI-only : aucun fetch, aucune logique métier.
 * - RHF contrôlé via `Controller`.
 * - Les états d’erreur (invalid/message) sont fournis par le shell.
 */

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

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
