"use client";

/**
 * @file apps/studio/src/features/admin/users/forms/UserForm.tsx
 * @layer ui/organisms
 *
 * @description
 * Formulaire d’édition / création d’un user Studio — RHF + Zod comme SoT UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Erreurs bloquantes near-field.
 * - Focus/scroll du premier champ invalide au submit.
 * - Focus impératif du champ email via IDs stables (sans ref).
 * - Users = Studio-only : pas de draft/published, pas de state.
 */

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

import {
  UserFormSchema,
  type UserFormValues,
} from "@compoz/validation/users/user-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { notify } from "@compoz/studio/lib/ui/notify";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import type { FieldErrors } from "react-hook-form";
import { Controller, useForm, useFormState, useWatch } from "react-hook-form";

type RoleOption = Readonly<{ value: "admin" | "editor"; label: string }>;

type UserFormProps = Readonly<{
  initialValues: UserFormValues;
  isSaving?: boolean;

  /** Mode UI (impacte labels et actions). */
  mode?: "create" | "edit";

  /* Active/déscative l’auto-focus des champs du formulaire (sauf celui des erreurs) */
  bFocusFields?: boolean;

  /* Permet d'annuler le comportement bouton “annuler” toujours actif en mode edit*/
  bCancelAlwaysEnabledInEdit?: boolean;

  /** Options de tenantIds (si tu veux proposer un select plus tard). */
  tenantIdOptions?: ReadonlyArray<{ value: string; label: string }>;

  // ✅ NEW: delete
  onDelete?: () => void | Promise<void>;
  isDeleting?: boolean;
  canDelete?: boolean;

  onSubmit: (values: UserFormValues) => void | Promise<void>;
  onReset?: () => void;

  onDirtyChange?: (dirty: boolean) => void;
  onBlockingErrorsCountChange?: (count: number) => void;
}>;

export function UserForm({
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
}: UserFormProps) {
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
  const t = useTranslations();

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

  const focusById = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    setTimeout(() => {
      (el as HTMLElement).focus?.();
    }, 50);
  };

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

    queueMicrotask(() => focusById(emailIds.fieldId));
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

  const isEdit = mode === "edit";
  const passwordHelp = isEdit
    ? t("admin.users.form.password.helpEdit")
    : t("admin.users.form.password.helpCreate");

  const safePasswordHelp =
    passwordHelp ||
    (isEdit
      ? t("admin.users.form.password.helpEditFallback")
      : t("admin.users.form.password.helpCreateFallback"));

  const roles: ReadonlyArray<RoleOption> = [
    { value: "admin", label: t("admin.users.form.rbac.role.options.admin") },
    { value: "editor", label: t("admin.users.form.rbac.role.options.editor") },
  ];

  const showError = isSubmitted || submitCount > 0;

  const invalidEmail =
    (showError || !!touchedFields.email) &&
    Boolean(errors.email?.message ?? errors.email);
  const emailErrorMessage =
    (showError || !!touchedFields.email) && errors.email?.message
      ? String(errors.email.message)
      : undefined;

  const invalidName =
    (showError || !!touchedFields.name) &&
    Boolean(errors.name?.message ?? errors.name);
  const nameErrorMessage =
    (showError || !!touchedFields.name) && errors.name?.message
      ? String(errors.name.message)
      : undefined;

  const invalidPassword =
    (showError || !!touchedFields.password) &&
    Boolean(errors.password?.message ?? errors.password);
  const passwordErrorMessage =
    (showError || !!touchedFields.password) && errors.password?.message
      ? String(errors.password.message)
      : undefined;

  const invalidRole =
    (showError || !!touchedFields.rbac?.role) &&
    Boolean(errors.rbac?.role?.message ?? errors.rbac?.role);

  const invalidTenantIds =
    (showError || !!touchedFields.rbac?.tenantIds) &&
    Boolean(errors.rbac?.tenantIds?.message ?? errors.rbac?.tenantIds);

  const invalidDefaultTenantId =
    (showError || !!touchedFields.rbac?.defaultTenantId) &&
    Boolean(
      errors.rbac?.defaultTenantId?.message ?? errors.rbac?.defaultTenantId,
    );

  const blockingErrorsCount = useMemo(() => {
    const invalids = [
      invalidEmail,
      invalidName,
      invalidPassword,
      invalidRole,
      invalidTenantIds,
      invalidDefaultTenantId,
    ];
    return invalids.filter(Boolean).length;
  }, [
    invalidEmail,
    invalidName,
    invalidPassword,
    invalidRole,
    invalidTenantIds,
    invalidDefaultTenantId,
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

    focusById(first.id);
  }

  const summaryBlock = (
    <FormGrid>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <InputField
            ids={emailIds}
            inputRef={field.ref}
            label={t("admin.users.form.email.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={() => field.onBlur()}
            placeholder={
              mode === "edit"
                ? t("admin.users.form.email.placeholderEdit")
                : t("admin.users.form.email.placeholderCreate")
            }
            help={t("admin.users.form.email.help")}
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isBusy}
            invalid={invalidEmail}
            error={emailErrorMessage}
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
            label={t("admin.users.form.name.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            placeholder={
              mode === "edit"
                ? t("admin.users.form.name.placeholderEdit")
                : t("admin.users.form.name.placeholderCreate")
            }
            help={t("admin.users.form.name.help")}
            required
            autoCapitalize="words"
            spellCheck={false}
            disabled={isBusy}
            invalid={invalidName}
            error={nameErrorMessage}
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
            label={t("admin.users.form.password.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            placeholder={
              mode === "edit"
                ? t("admin.users.form.password.placeholderEdit")
                : t("admin.users.form.password.placeholderCreate")
            }
            help={safePasswordHelp}
            type="password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isBusy}
            invalid={invalidPassword}
            error={passwordErrorMessage}
          />
        )}
      />
    </FormGrid>
  );

  const resetDisabledTooltip = isSaving
    ? t("common.saving")
    : isDirty === false
      ? t("admin.actionsBar.noChangesToReset")
      : t("common.actionUnavailable");

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
          <ExpandableLayout
            id={`${formIdPrefix}-rbac`}
            label={t("admin.users.form.rbac.expandableLabel")}
            defaultOpen={false}
            disabled={isBusy}
            summary={summaryBlock}
          >
            <div className={cn(STACK_SM, "px-2")}>
              <Controller
                name="rbac.role"
                control={control}
                render={({ field }) => (
                  <SelectField
                    ids={roleIds}
                    label={t("admin.users.form.rbac.role.label")}
                    help={t("admin.users.form.rbac.role.help")}
                    value={field.value ?? "editor"}
                    onChange={(val) => {
                      const v = String(val ?? "").trim();
                      field.onChange(v === "admin" ? "admin" : "editor");
                    }}
                    items={roles.map((r) => ({
                      value: r.value,
                      label: r.label,
                    }))}
                    disabled={isBusy}
                    invalid={invalidRole}
                    error={
                      (showError || !!touchedFields.rbac?.role) &&
                      errors.rbac?.role?.message
                        ? String(errors.rbac?.role?.message)
                        : undefined
                    }
                  />
                )}
              />

              <Controller
                name="rbac.tenantIds"
                control={control}
                render={({ field }) => {
                  const value = Array.isArray(field.value)
                    ? field.value.join(", ")
                    : "";

                  return (
                    <InputField
                      ids={tenantIdsIds}
                      label={t("admin.users.form.rbac.tenantIds.label")}
                      help={t("admin.users.form.rbac.tenantIds.help")}
                      value={value}
                      onChange={(v) => {
                        const raw = String(v ?? "");
                        const parts = raw
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean);
                        field.onChange(parts);
                      }}
                      onBlur={field.onBlur}
                      placeholder={t(
                        "admin.users.form.rbac.tenantIds.placeholder",
                      )}
                      disabled={isBusy}
                      invalid={invalidTenantIds}
                      error={
                        (showError || !!touchedFields.rbac?.tenantIds) &&
                        errors.rbac?.tenantIds?.message
                          ? String(errors.rbac?.tenantIds?.message)
                          : undefined
                      }
                    />
                  );
                }}
              />

              <Controller
                name="rbac.defaultTenantId"
                control={control}
                render={({ field }) => {
                  const options = tenantIdOptions ?? [];

                  if (options.length > 0) {
                    return (
                      <SelectField
                        ids={defaultTenantIdIds}
                        label={t("admin.users.form.rbac.defaultTenantId.label")}
                        help={t("admin.users.form.rbac.defaultTenantId.help")}
                        value={field.value ?? ""}
                        onChange={(val) =>
                          field.onChange(String(val ?? "").trim())
                        }
                        items={options.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                        disabled={isBusy}
                        invalid={invalidDefaultTenantId}
                        error={
                          (showError ||
                            !!touchedFields.rbac?.defaultTenantId) &&
                          errors.rbac?.defaultTenantId?.message
                            ? String(errors.rbac?.defaultTenantId?.message)
                            : undefined
                        }
                      />
                    );
                  }

                  return (
                    <InputField
                      ids={defaultTenantIdIds}
                      label={t("admin.users.form.rbac.defaultTenantId.label")}
                      help={t("admin.users.form.rbac.defaultTenantId.help")}
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(String(v ?? "").trim())}
                      onBlur={field.onBlur}
                      placeholder={t(
                        "admin.users.form.rbac.defaultTenantId.placeholder",
                      )}
                      disabled={isBusy}
                      invalid={invalidDefaultTenantId}
                      error={
                        (showError || !!touchedFields.rbac?.defaultTenantId) &&
                        errors.rbac?.defaultTenantId?.message
                          ? String(errors.rbac?.defaultTenantId?.message)
                          : undefined
                      }
                    />
                  );
                }}
              />

              <div className={cn("md:justify-self-end")}>
                <div className="md:mt-[1.6rem] flex h-9 items-center justify-end">
                  <TooltipButton
                    type="button"
                    variant="outline"
                    size="icon"
                    onPointerDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      const r = initialValues.rbac;
                      rhfReset(
                        { ...values, rbac: r },
                        {
                          keepDirty: true,
                          keepTouched: true,
                          keepErrors: true,
                        },
                      );
                    }}
                    disabled={isBusy}
                    tooltip={isBusy ? resetDisabledTooltip : t("common.reset")}
                  >
                    <RotateCcw />
                  </TooltipButton>
                </div>
              </div>
            </div>
          </ExpandableLayout>
        </CardContent>

        <CardFooter>
          {/* ✅ Delete (edit only) + Actions */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {mode === "edit" && onDelete ? (
              <DeleteButton
                disabled={!canDelete || isBusy}
                isDeleting={isDeleting}
                size="icon"
                onConfirmDelete={async () => onDelete?.()}
                ariaLabel={t("common.delete")}
                title={t("common.delete")}
                confirm={
                  {
                    // Optionnel : tu peux préciser un requireAcknowledge si tu veux
                    // requireAcknowledge: true,
                  }
                }
              />
            ) : (
              <span />
            )}

            <div className="sm:w-auto w-full">
              <ActionsBar
                variant={"resetSubmit"}
                isSaving={isSaving || isSubmitting}
                isDirty={
                  mode === "edit" && !bCancelAlwaysEnabledInEdit
                    ? true
                    : isDirty
                }
                resetLabel={mode === "edit" ? t("common.cancel") : undefined}
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
            </div>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

UserForm.displayName = "UserForm";
