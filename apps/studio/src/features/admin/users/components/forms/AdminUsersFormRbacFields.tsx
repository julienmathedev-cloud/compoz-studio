"use client";

/**
 * @file apps/studio/src/features/admin/users/components/forms/AdminUsersFormRbacFields.tsx
 * @layer ui/organisms
 *
 * @description
 * Section RBAC avancée du formulaire Users :
 * role / websiteIds / defaultWebsiteId.
 *
 * @remarks
 * - Strictement UI-only : aucun fetch, aucune logique métier.
 * - Encapsule l’`ExpandableLayout` et le bouton “reset RBAC”.
 * - Le contenu summary est fourni via `children`.
 * - Les accès RBAC sont exprimés en Prisma Website.id.
 */

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldNamesMarkedBoolean,
  type UseFormReset,
} from "react-hook-form";

import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { UserFormValues } from "@compoz/validation/users/user-form";

import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";

type RoleOption = Readonly<{
  value: "admin" | "editor";
  label: string;
}>;

type SelectOption = Readonly<{
  value: string;
  label: string;
}>;

type FieldErrorState = Readonly<{
  invalid: boolean;
  message?: string;
}>;

type AdminUsersFormRbacFieldsProps = Readonly<{
  mode: "create" | "edit";
  isBusy: boolean;

  initialValues: UserFormValues;
  values: UserFormValues;

  websiteOptions?: ReadonlyArray<SelectOption>;

  control: Control<UserFormValues>;
  rhfReset: UseFormReset<UserFormValues>;

  formIdPrefix: string;

  emailIds: FieldIds;
  nameIds: FieldIds;
  passwordIds: FieldIds;

  roleIds: FieldIds;
  websiteIdsIds: FieldIds;
  defaultWebsiteIdIds: FieldIds;

  showError: boolean;
  touchedFields: FieldNamesMarkedBoolean<UserFormValues>;
  errors: FieldErrors<UserFormValues>;

  emailState: FieldErrorState;
  nameState: FieldErrorState;
  passwordState: FieldErrorState;
  roleState: FieldErrorState;
  websiteIdsState: FieldErrorState;
  defaultWebsiteIdState: FieldErrorState;

  children: ReactNode;
}>;

export function AdminUsersFormRbacFields({
  mode,
  isBusy,
  initialValues,
  values,
  websiteOptions,
  control,
  rhfReset,
  formIdPrefix,
  roleIds,
  websiteIdsIds,
  defaultWebsiteIdIds,
  showError,
  touchedFields,
  errors,
  roleState,
  websiteIdsState,
  defaultWebsiteIdState,
  children,
}: AdminUsersFormRbacFieldsProps) {
  const t = useTranslations();

  const isEdit = mode === "edit";

  const roles: ReadonlyArray<RoleOption> = [
    {
      value: "admin",
      label: t("studio.users.form.rbac.role.options.admin"),
    },
    {
      value: "editor",
      label: t("studio.users.form.rbac.role.options.editor"),
    },
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
                onChange={(value) => {
                  const role = String(value ?? "").trim();

                  field.onChange(role === "admin" ? "admin" : "editor");
                }}
                items={roles.map((role) => ({
                  value: role.value,
                  label: role.label,
                }))}
                disabled={isBusy}
                invalid={roleState.invalid}
                error={
                  (showError || Boolean(touchedFields.rbac?.role)) &&
                  errors.rbac?.role?.message
                    ? String(errors.rbac.role.message)
                    : undefined
                }
              />
            )}
          />

          <Controller
            name="rbac.websiteIds"
            control={control}
            render={({ field }) => {
              const value = Array.isArray(field.value)
                ? field.value.join(", ")
                : "";

              return (
                <InputField
                  ids={websiteIdsIds}
                  label={t("studio.users.form.rbac.websiteIds.label")}
                  help={t("studio.users.form.rbac.websiteIds.help")}
                  value={value}
                  onChange={(nextValue) => {
                    const raw = String(nextValue ?? "");

                    const websiteIds = raw
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);

                    field.onChange(websiteIds);
                  }}
                  onBlur={field.onBlur}
                  placeholder={t(
                    "studio.users.form.rbac.websiteIds.placeholder",
                  )}
                  disabled={isBusy}
                  invalid={websiteIdsState.invalid}
                  error={
                    (showError || Boolean(touchedFields.rbac?.websiteIds)) &&
                    errors.rbac?.websiteIds?.message
                      ? String(errors.rbac.websiteIds.message)
                      : undefined
                  }
                />
              );
            }}
          />

          <Controller
            name="rbac.defaultWebsiteId"
            control={control}
            render={({ field }) => {
              const options = websiteOptions ?? [];

              if (options.length > 0) {
                return (
                  <SelectField
                    ids={defaultWebsiteIdIds}
                    label={t("studio.users.form.rbac.defaultWebsiteId.label")}
                    help={t("studio.users.form.rbac.defaultWebsiteId.help")}
                    value={field.value ?? ""}
                    onChange={(value) =>
                      field.onChange(String(value ?? "").trim())
                    }
                    items={options.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    disabled={isBusy}
                    invalid={defaultWebsiteIdState.invalid}
                    error={
                      (showError ||
                        Boolean(touchedFields.rbac?.defaultWebsiteId)) &&
                      errors.rbac?.defaultWebsiteId?.message
                        ? String(errors.rbac.defaultWebsiteId.message)
                        : undefined
                    }
                  />
                );
              }

              return (
                <InputField
                  ids={defaultWebsiteIdIds}
                  label={t("studio.users.form.rbac.defaultWebsiteId.label")}
                  help={t("studio.users.form.rbac.defaultWebsiteId.help")}
                  value={field.value ?? ""}
                  onChange={(value) =>
                    field.onChange(String(value ?? "").trim())
                  }
                  onBlur={field.onBlur}
                  placeholder={t(
                    "studio.users.form.rbac.defaultWebsiteId.placeholder",
                  )}
                  disabled={isBusy}
                  invalid={defaultWebsiteIdState.invalid}
                  error={
                    (showError ||
                      Boolean(touchedFields.rbac?.defaultWebsiteId)) &&
                    errors.rbac?.defaultWebsiteId?.message
                      ? String(errors.rbac.defaultWebsiteId.message)
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
                visualMode="studio"
                size="icon"
                onPointerDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  const rbac = initialValues.rbac;

                  rhfReset(
                    { ...values, rbac },
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
