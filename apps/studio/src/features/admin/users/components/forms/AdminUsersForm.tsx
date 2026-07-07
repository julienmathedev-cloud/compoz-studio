"use client";

/**
 * @file apps/studio/src/features/admin/users/components/forms/AdminUsersForm.tsx
 * @layer studio/features/admin/users/components/forms
 *
 * @description
 * React Hook Form and Zod shell for creating or editing Studio users.
 *
 * @remarks
 * - Owns form initialization, submit/reset orchestration, and the Card layout.
 * - Delegates summary, RBAC, and footer UI to dedicated form sections.
 * - Focuses the first invalid field on submit through `focusByFieldId`.
 * - Users are Studio-only data: no draft/published state is involved.
 */

import { useEffect, useMemo } from "react";
import type { FieldErrors } from "react-hook-form";
import { useForm, useFormState, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { focusByFieldId } from "@compoz/ui/lib/focus";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";

import { notify } from "@compoz/studio/lib/ui/notify";

import { AdminUsersFormFooter } from "@compoz/studio/features/admin/users/components/forms/AdminUsersFormFooter";
import { AdminUsersFormRbacFields } from "@compoz/studio/features/admin/users/components/forms/AdminUsersFormRbacFields";
import { AdminUsersFormSummaryFields } from "@compoz/studio/features/admin/users/components/forms/AdminUsersFormSummaryFields";

import {
  UserFormSchema,
  type UserFormValues,
} from "@compoz/validation/users/user-form";

type SelectOption = Readonly<{
  value: string;
  label: string;
}>;

type AdminUsersFormProps = Readonly<{
  initialValues: UserFormValues;
  isSaving?: boolean;
  mode?: "create" | "edit";
  bFocusFields?: boolean;
  bCancelAlwaysEnabledInEdit?: boolean;
  websiteOptions?: ReadonlyArray<SelectOption>;
  onDelete?: () => void | Promise<void>;
  isDeleting?: boolean;
  canDelete?: boolean;
  onSubmit: (values: UserFormValues) => void | Promise<void>;
  onReset?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onBlockingErrorsCountChange?: (count: number) => void;
}>;

type FieldErrorState = Readonly<{
  invalid: boolean;
  message?: string;
}>;

/**
 * Resolves the visible error state for a field without changing form validation rules.
 */
function getFieldErrorState(opts: {
  showError: boolean;
  touched: boolean;
  error?: { message?: unknown } | unknown;
}): FieldErrorState {
  const shouldShow = opts.showError || opts.touched;

  const hasError =
    shouldShow &&
    Boolean((opts.error as { message?: unknown })?.message ?? opts.error);

  const message =
    shouldShow && (opts.error as { message?: unknown })?.message
      ? String((opts.error as { message?: unknown })?.message)
      : undefined;

  return {
    invalid: Boolean(hasError),
    message,
  };
}

export function AdminUsersForm({
  initialValues,
  isSaving,
  mode = "create",
  bFocusFields = true,
  bCancelAlwaysEnabledInEdit = false,
  websiteOptions,
  onDelete,
  isDeleting = false,
  canDelete = true,
  onSubmit,
  onReset,
  onDirtyChange,
  onBlockingErrorsCountChange,
}: AdminUsersFormProps) {
  const t = useTranslations();

  const {
    control,
    handleSubmit,
    reset: rhfReset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const {
    isDirty,
    isSubmitting,
    submitCount,
    isSubmitted,
    touchedFields,
    errors,
  } = useFormState({ control });

  const isBusy = Boolean(isSaving || isSubmitting || isDeleting);

  /** Sends the dirty state to parent guards, such as navigation protection. */
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const formIdPrefix = useIdPrefix("user-form");

  const emailIds = createFieldIds(formIdPrefix, "email");
  const nameIds = createFieldIds(formIdPrefix, "name");
  const passwordIds = createFieldIds(formIdPrefix, "password");
  const roleIds = createFieldIds(formIdPrefix, "role");
  const websiteIdsIds = createFieldIds(formIdPrefix, "websiteIds");
  const defaultWebsiteIdIds = createFieldIds(formIdPrefix, "defaultWebsiteId");

  /** Resynchronizes RHF when `initialValues` changes. */
  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  /** Focuses the email field when switching edited users. */
  useEffect(() => {
    if (mode !== "edit" || !bFocusFields) return;
    if (isBusy) return;

    queueMicrotask(() => focusByFieldId(emailIds.fieldId));
  }, [mode, bFocusFields, isBusy, initialValues, emailIds.fieldId]);

  const watchedValues =
    (useWatch({ control }) as UserFormValues | undefined) ?? initialValues;

  const values: UserFormValues =
    watchedValues ??
    ({
      email: "",
      name: "",
      password: "",
      rbac: {
        role: "editor",
        websiteIds: ["default"],
        defaultWebsiteId: "default",
      },
    } as UserFormValues);

  const showError = isSubmitted || submitCount > 0;

  const emailState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.email),
    error: errors.email,
  });

  const nameState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.name),
    error: errors.name,
  });

  const passwordState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.password),
    error: errors.password,
  });

  const roleState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.rbac?.role),
    error: errors.rbac?.role,
  });

  const websiteIdsState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.rbac?.websiteIds),
    error: errors.rbac?.websiteIds,
  });

  const defaultWebsiteIdState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.rbac?.defaultWebsiteId),
    error: errors.rbac?.defaultWebsiteId,
  });

  const blockingErrorsCount = useMemo(() => {
    const invalids = [
      emailState.invalid,
      nameState.invalid,
      passwordState.invalid,
      roleState.invalid,
      websiteIdsState.invalid,
      defaultWebsiteIdState.invalid,
    ];

    return invalids.filter(Boolean).length;
  }, [
    emailState.invalid,
    nameState.invalid,
    passwordState.invalid,
    roleState.invalid,
    websiteIdsState.invalid,
    defaultWebsiteIdState.invalid,
  ]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  const submitLabel = mode === "edit" ? t("common.save") : t("common.create");

  const submitLoadingLabel =
    mode === "edit" ? t("common.saving") : t("common.creating");

  function handleSubmitErrors(formErrors: FieldErrors<UserFormValues>) {
    notify.error(t("uiErrors.formHasErrors"));

    const PRIORITY = [
      { has: () => Boolean(formErrors.email), id: emailIds.fieldId },
      { has: () => Boolean(formErrors.name), id: nameIds.fieldId },
      { has: () => Boolean(formErrors.password), id: passwordIds.fieldId },
      { has: () => Boolean(formErrors.rbac?.role), id: roleIds.fieldId },
      {
        has: () => Boolean(formErrors.rbac?.websiteIds),
        id: websiteIdsIds.fieldId,
      },
      {
        has: () => Boolean(formErrors.rbac?.defaultWebsiteId),
        id: defaultWebsiteIdIds.fieldId,
      },
    ] as const;

    const first = PRIORITY.find((item) => item.has());

    if (!first) return;

    focusByFieldId(first.id);
  }

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(
        async (formValues) => onSubmit(formValues),
        handleSubmitErrors,
      )}
      noValidate
    >
      <Card variant="panel" visualMode="studio">
        <CardContent>
          <AdminUsersFormRbacFields
            mode={mode}
            isBusy={isBusy}
            initialValues={initialValues}
            values={values}
            websiteOptions={websiteOptions}
            control={control}
            rhfReset={rhfReset}
            formIdPrefix={formIdPrefix}
            emailIds={emailIds}
            nameIds={nameIds}
            passwordIds={passwordIds}
            roleIds={roleIds}
            websiteIdsIds={websiteIdsIds}
            defaultWebsiteIdIds={defaultWebsiteIdIds}
            showError={showError}
            touchedFields={touchedFields}
            errors={errors}
            emailState={emailState}
            nameState={nameState}
            passwordState={passwordState}
            roleState={roleState}
            websiteIdsState={websiteIdsState}
            defaultWebsiteIdState={defaultWebsiteIdState}
          >
            <AdminUsersFormSummaryFields
              mode={mode}
              isBusy={isBusy}
              control={control}
              emailIds={emailIds}
              nameIds={nameIds}
              passwordIds={passwordIds}
              emailState={emailState}
              nameState={nameState}
              passwordState={passwordState}
            />
          </AdminUsersFormRbacFields>
        </CardContent>

        <CardFooter>
          <AdminUsersFormFooter
            mode={mode}
            isSaving={Boolean(isSaving || isSubmitting)}
            isDirty={
              mode === "edit" && !bCancelAlwaysEnabledInEdit ? true : isDirty
            }
            isBusy={isBusy}
            canDelete={canDelete}
            isDeleting={isDeleting}
            onDelete={onDelete}
            submitLabel={submitLabel}
            submitLoadingLabel={submitLoadingLabel}
            onReset={() => {
              rhfReset(initialValues, {
                keepDirty: false,
                keepTouched: false,
                keepErrors: false,
              });

              onReset?.();
            }}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

AdminUsersForm.displayName = "AdminUsersForm";
