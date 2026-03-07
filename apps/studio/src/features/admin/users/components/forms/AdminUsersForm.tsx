"use client";

/**
 * @file apps/studio/src/features/admin/users/components/forms/AdminUsersForm.tsx
 * @layer ui/organisms
 *
 * @description
 * Formulaire d’édition / création d’un user Studio — Shell RHF + Zod (SoT UI).
 *
 * @remarks
 * - Ce fichier est le “shell” : init RHF, submit/reset, Card layout, orchestration.
 * - Les sections UI sont extraites :
 *   - `AdminUsersFormSummaryFields` (email/name/password)
 *   - `AdminUsersFormRbacFields` (rbac avancé)
 *   - `AdminUsersFormFooter` (delete + actions)
 * - Focus/scroll du premier champ invalide au submit via `focusByFieldId` (helper dédié).
 * - Users = Studio-only : pas de draft/published, pas de state.
 */

import { useEffect, useMemo } from "react";
import type { FieldErrors } from "react-hook-form";
import { useForm, useFormState, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";

import {
  UserFormSchema,
  type UserFormValues,
} from "@compoz/validation/users/user-form";

import { notify } from "@compoz/studio/lib/ui/notify";
import { focusByFieldId } from "@compoz/ui/lib/focus";

import { AdminUsersFormFooter } from "@compoz/studio/features/admin/users/components/forms/AdminUsersFormFooter";
import { AdminUsersFormRbacFields } from "@compoz/studio/features/admin/users/components/forms/AdminUsersFormRbacFields";
import { AdminUsersFormSummaryFields } from "@compoz/studio/features/admin/users/components/forms/AdminUsersFormSummaryFields";

type AdminUsersFormProps = Readonly<{
  initialValues: UserFormValues;
  isSaving?: boolean;

  /** Mode UI (impacte labels et actions). */
  mode?: "create" | "edit";

  /** Active/désactive l’auto-focus des champs du formulaire (sauf celui des erreurs). */
  bFocusFields?: boolean;

  /** Permet d’annuler le comportement bouton “annuler” toujours actif en mode edit. */
  bCancelAlwaysEnabledInEdit?: boolean;

  /** Options de tenantIds (si tu veux proposer un select). */
  tenantIdOptions?: ReadonlyArray<{ value: string; label: string }>;

  /** Delete (edit only). */
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
 * Calcule l’état d’erreur d’un champ (invalid + message optionnel) de façon stable.
 *
 * @remarks
 * - Ne change pas la logique métier : on garde les mêmes règles que le code initial.
 * - `showError` = submitted || submitCount>0.
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

  const msg =
    shouldShow && (opts.error as { message?: unknown })?.message
      ? String((opts.error as { message?: unknown })?.message)
      : undefined;

  return { invalid: Boolean(hasError), message: msg } as const;
}

export function AdminUsersForm({
  initialValues,
  isSaving,
  mode = "create",
  bFocusFields = true,
  bCancelAlwaysEnabledInEdit = false,
  tenantIdOptions,
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

  // Dirty signal vers le parent (guard / navigation).
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Préfixe d’ID stable pour ce formulaire.
  const formIdPrefix = useIdPrefix("user-form");
  const emailIds = createFieldIds(formIdPrefix, "email");
  const nameIds = createFieldIds(formIdPrefix, "name");
  const passwordIds = createFieldIds(formIdPrefix, "password");
  const roleIds = createFieldIds(formIdPrefix, "role");
  const tenantIdsIds = createFieldIds(formIdPrefix, "tenantIds");
  const defaultTenantIdIds = createFieldIds(formIdPrefix, "defaultTenantId");

  // Resynchronisation RHF lorsque `initialValues` change (reload côté section).
  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  // Focus auto du champ email en mode edit (changement de user).
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
        tenantIds: ["default"],
        defaultTenantId: "default",
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

  const tenantIdsState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.rbac?.tenantIds),
    error: errors.rbac?.tenantIds,
  });

  const defaultTenantIdState = getFieldErrorState({
    showError,
    touched: Boolean(touchedFields.rbac?.defaultTenantId),
    error: errors.rbac?.defaultTenantId,
  });

  const blockingErrorsCount = useMemo(() => {
    const invalids = [
      emailState.invalid,
      nameState.invalid,
      passwordState.invalid,
      roleState.invalid,
      tenantIdsState.invalid,
      defaultTenantIdState.invalid,
    ];
    return invalids.filter(Boolean).length;
  }, [
    emailState.invalid,
    nameState.invalid,
    passwordState.invalid,
    roleState.invalid,
    tenantIdsState.invalid,
    defaultTenantIdState.invalid,
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
        has: () => Boolean(formErrors.rbac?.tenantIds),
        id: tenantIdsIds.fieldId,
      },
      {
        has: () => Boolean(formErrors.rbac?.defaultTenantId),
        id: defaultTenantIdIds.fieldId,
      },
    ] as const;

    const first = PRIORITY.find((x) => x.has());
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
      <Card variant="panel">
        <CardContent>
          <AdminUsersFormRbacFields
            mode={mode}
            isBusy={isBusy}
            initialValues={initialValues}
            values={values}
            tenantIdOptions={tenantIdOptions}
            control={control}
            rhfReset={rhfReset}
            formIdPrefix={formIdPrefix}
            emailIds={emailIds}
            nameIds={nameIds}
            passwordIds={passwordIds}
            roleIds={roleIds}
            tenantIdsIds={tenantIdsIds}
            defaultTenantIdIds={defaultTenantIdIds}
            showError={showError}
            touchedFields={touchedFields}
            errors={errors}
            emailState={emailState}
            nameState={nameState}
            passwordState={passwordState}
            roleState={roleState}
            tenantIdsState={tenantIdsState}
            defaultTenantIdState={defaultTenantIdState}
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
