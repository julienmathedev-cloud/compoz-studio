"use client";

/**
 * @file apps/studio/src/features/admin/users/components/forms/AdminUsersFormFooter.tsx
 * @layer studio/features/admin/users/components/forms
 *
 * @description
 * Footer for the Studio user form, with optional delete and reset/submit actions.
 *
 * @remarks
 * - The parent provides callbacks and busy states.
 * - Delete is available only in edit mode when `onDelete` is provided.
 */

import { useTranslations } from "next-intl";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";

type AdminUsersFormFooterProps = Readonly<{
  mode: "create" | "edit";

  isSaving: boolean;
  isDirty: boolean;

  isBusy: boolean;

  canDelete?: boolean;
  isDeleting?: boolean;
  onDelete?: () => void | Promise<void>;

  submitLabel: string;
  submitLoadingLabel: string;

  onReset: () => void;
}>;

export function AdminUsersFormFooter({
  mode,
  isSaving,
  isDirty,
  isBusy,
  canDelete = true,
  isDeleting = false,
  onDelete,
  submitLabel,
  submitLoadingLabel,
  onReset,
}: AdminUsersFormFooterProps) {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {mode === "edit" && onDelete ? (
        <DeleteButton
          disabled={!canDelete || isBusy}
          isDeleting={isDeleting}
          size="icon"
          onConfirmDelete={async () => onDelete?.()}
          ariaLabel={t("common.delete")}
          title={t("common.delete")}
          confirm={{}}
        />
      ) : (
        <span />
      )}

      <div className="sm:w-auto w-full">
        <ActionsBar
          variant="resetSubmit"
          isSaving={isSaving}
          isDirty={isDirty}
          resetLabel={mode === "edit" ? t("common.cancel") : undefined}
          submitLabel={submitLabel}
          submitLoadingLabel={submitLoadingLabel}
          onReset={onReset}
        />
      </div>
    </div>
  );
}

AdminUsersFormFooter.displayName = "AdminUsersFormFooter";
