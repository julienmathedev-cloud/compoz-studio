"use client";

/**
 * @file apps/studio/src/features/admin/users/forms/components/AdminUsersFormFooter.tsx
 * @layer ui/organisms
 *
 * @description
 * Footer du formulaire Users : Delete (edit only) + ActionsBar (reset/submit).
 *
 * @remarks
 * - Strictement UI-only : aucune logique métier.
 * - Le parent fournit les callbacks (reset/delete) et les états.
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
