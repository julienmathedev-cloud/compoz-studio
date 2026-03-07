"use client";

/**
 * @file apps/studio/src/features/admin/users/components/forms/AdminUsersFormRbacFields.tsx
 * @layer ui/organisms
 *
 * @description
 * Section “RBAC avancé” du formulaire Users : role / tenantIds / defaultTenantId.
 *
 * @remarks
 * - Strictement UI-only : aucun fetch, aucune logique métier.
 * - Encapsule l’`ExpandableLayout` et le bouton “reset RBAC”.
 * - Le contenu summary est fourni via `children`.
 */

import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type UseFormReset,
  type FieldErrors,
  type FieldNamesMarkedBoolean,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { UserFormValues } from "@compoz/validation/users/user-form";

import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";

type RoleOption = Readonly<{ value: "admin" | "editor"; label: string }>;
type FieldErrorState = Readonly<{ invalid: boolean; message?: string }>;

type AdminUsersFormRbacFieldsProps = Readonly<{
  mode: "create" | "edit";
  isBusy: boolean;

  initialValues: UserFormValues;
  values: UserFormValues;

  tenantIdOptions?: ReadonlyArray<{ value: string; label: string }>;

  control: Control<UserFormValues>;
  rhfReset: UseFormReset<UserFormValues>;

  formIdPrefix: string;

  emailIds: FieldIds;
  nameIds: FieldIds;
  passwordIds: FieldIds;

  roleIds: FieldIds;
  tenantIdsIds: FieldIds;
  defaultTenantIdIds: FieldIds;

  showError: boolean;
  touchedFields: FieldNamesMarkedBoolean<UserFormValues>;
  errors: FieldErrors<UserFormValues>;

  emailState: FieldErrorState;
  nameState: FieldErrorState;
  passwordState: FieldErrorState;
  roleState: FieldErrorState;
  tenantIdsState: FieldErrorState;
  defaultTenantIdState: FieldErrorState;

  children: ReactNode;
}>;

export function AdminUsersFormRbacFields({
  mode,
  isBusy,
  initialValues,
  values,
  tenantIdOptions,
  control,
  rhfReset,
  formIdPrefix,
  roleIds,
  tenantIdsIds,
  defaultTenantIdIds,
  showError,
  touchedFields,
  errors,
  roleState,
  tenantIdsState,
  defaultTenantIdState,
  children,
}: AdminUsersFormRbacFieldsProps) {
  const t = useTranslations();

  const isEdit = mode === "edit";

  const roles: ReadonlyArray<RoleOption> = [
    { value: "admin", label: t("studio.users.form.rbac.role.options.admin") },
    { value: "editor", label: t("studio.users.form.rbac.role.options.editor") },
  ];

  const resetDisabledTooltip = isBusy ? t("common.saving") : t("common.reset");

  return (
    <ExpandableLayout
      id={`${formIdPrefix}-rbac`}
      label={t("studio.users.form.rbac.expandableLabel")}
      defaultOpen={false}
      disabled={isBusy}
      summary={children}
    >
      <div className={cn(STACK_SM, "px-2")}>
        <FormGrid>
          <Controller
            name="rbac.role"
            control={control}
            render={({ field }) => (
              <SelectField
                ids={roleIds}
                label={t("studio.users.form.rbac.role.label")}
                help={t("studio.users.form.rbac.role.help")}
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
                invalid={roleState.invalid}
                error={
                  (showError || Boolean(touchedFields.rbac?.role)) &&
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
                  label={t("studio.users.form.rbac.tenantIds.label")}
                  help={t("studio.users.form.rbac.tenantIds.help")}
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
                  placeholder={t("studio.users.form.rbac.tenantIds.placeholder")}
                  disabled={isBusy}
                  invalid={tenantIdsState.invalid}
                  error={
                    (showError || Boolean(touchedFields.rbac?.tenantIds)) &&
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
                    label={t("studio.users.form.rbac.defaultTenantId.label")}
                    help={t("studio.users.form.rbac.defaultTenantId.help")}
                    value={field.value ?? ""}
                    onChange={(val) => field.onChange(String(val ?? "").trim())}
                    items={options.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    disabled={isBusy}
                    invalid={defaultTenantIdState.invalid}
                    error={
                      (showError ||
                        Boolean(touchedFields.rbac?.defaultTenantId)) &&
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
                  label={t("studio.users.form.rbac.defaultTenantId.label")}
                  help={t("studio.users.form.rbac.defaultTenantId.help")}
                  value={field.value ?? ""}
                  onChange={(v) => field.onChange(String(v ?? "").trim())}
                  onBlur={field.onBlur}
                  placeholder={t(
                    "studio.users.form.rbac.defaultTenantId.placeholder",
                  )}
                  disabled={isBusy}
                  invalid={defaultTenantIdState.invalid}
                  error={
                    (showError ||
                      Boolean(touchedFields.rbac?.defaultTenantId)) &&
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
                aria-label={t("common.reset")}
              >
                <RotateCcw />
              </TooltipButton>
            </div>
          </div>
        </FormGrid>

        {!isEdit ? null : null}
      </div>
    </ExpandableLayout>
  );
}

AdminUsersFormRbacFields.displayName = "AdminUsersFormRbacFields";
