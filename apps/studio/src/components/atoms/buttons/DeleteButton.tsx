"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/DeleteButton.tsx
 * @layer studio/atoms
 *
 * @description
 * Reusable Studio delete button with global confirmation.
 *
 * @remarks
 * - UI atom with no business logic.
 * - Calls `onConfirmDelete` only after confirmation.
 * - Can display an in-progress state through `isDeleting`.
 */

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Spinner } from "@compoz/ui/components/ui/spinner";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import type { ConfirmOptions } from "@compoz/studio/features/confirm/ConfirmDialogProvider";
import { useConfirm } from "@compoz/studio/features/confirm/useConfirm";

type DeleteButtonProps = Readonly<{
  onConfirmDelete: () => void | Promise<void>;
  disabled?: boolean;
  disabledTooltip?: ReactNode;
  isDeleting?: boolean;
  ariaLabel?: string;
  title?: string;
  confirm?: Omit<ConfirmOptions, "tone"> & { tone?: ConfirmOptions["tone"] };
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}>;

export function DeleteButton({
  onConfirmDelete,
  disabled = false,
  disabledTooltip,
  isDeleting = false,
  ariaLabel,
  title,
  confirm,
  size = "icon",
  className,
}: DeleteButtonProps) {
  const t = useTranslations();
  const aria = ariaLabel ?? t("common.delete");
  const ttl = title ?? t("common.delete");

  const askConfirm = useConfirm();
  const isDisabled = Boolean(disabled || isDeleting);

  return (
    <TooltipButton
      type="button"
      variant="destructive"
      visualMode="studio"
      size={size}
      disabled={isDisabled}
      aria-label={aria}
      aria-busy={isDeleting || undefined}
      tooltip={isDisabled ? (disabledTooltip ?? ttl) : ttl}
      className={className}
      onClick={async () => {
        if (isDisabled) return;

        const ok = await askConfirm({
          title: confirm?.title ?? t("studio.shared.confirm.delete.title"),
          description:
            confirm?.description ?? t("studio.shared.confirm.delete.intro"),
          confirmLabel: confirm?.confirmLabel ?? t("common.delete"),
          cancelLabel: confirm?.cancelLabel ?? t("common.cancel"),
          tone: confirm?.tone ?? "danger",
          requireAcknowledge: confirm?.requireAcknowledge,
        });

        if (!ok) return;
        await onConfirmDelete();
      }}
    >
      <StudioIcon
        icon={isDeleting ? Spinner : Trash2}
        className={isDeleting ? "motion-safe:animate-spin" : undefined}
      />
    </TooltipButton>
  );
}

DeleteButton.displayName = "DeleteButton";
