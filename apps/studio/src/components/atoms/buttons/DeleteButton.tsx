"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/DeleteButton.tsx
 * @layer studio/atoms
 *
 * @description
 * Bouton de suppression réutilisable (Studio) avec confirmation globale.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Déclenche `onConfirmDelete` uniquement après confirmation.
 * - Peut afficher un état "en cours" via `isDeleting`.
 */

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Spinner } from "@compoz/ui/components/ui/spinner";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import type { ConfirmOptions } from "@compoz/studio/features/confirm/ConfirmDialogProvider";
import { useConfirm } from "@compoz/studio/features/confirm/useConfirm";

/**
 * Props du composant `DeleteButton`.
 */
type DeleteButtonProps = Readonly<{
  /** Action exécutée uniquement si l’utilisateur confirme. */
  onConfirmDelete: () => void | Promise<void>;

  /** Désactive le bouton (ex: busy, disabled parent). */
  disabled?: boolean;

  /** Tooltip affiché quand l’action est désactivée (ex: “Impossible car …”). */
  disabledTooltip?: ReactNode;

  /** Affiche un état de suppression en cours (spinner + bouton disabled). */
  isDeleting?: boolean;

  /** Libellés a11y/UX du bouton. */
  ariaLabel?: string;
  title?: string;

  /** Options de confirmation (defaults adaptés aux suppressions). */
  confirm?: Omit<ConfirmOptions, "tone"> & { tone?: ConfirmOptions["tone"] };

  /** Taille du bouton (shadcn). */
  size?: "default" | "sm" | "lg" | "icon";
}>;

/**
 * Bouton de suppression (destructive) avec confirmation.
 */
export function DeleteButton({
  onConfirmDelete,
  disabled = false,
  disabledTooltip,
  isDeleting = false,
  ariaLabel,
  title,
  confirm,
  size = "icon",
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
      size={size}
      disabled={isDisabled}
      aria-label={aria}
      aria-busy={isDeleting || undefined}
      tooltip={isDisabled ? (disabledTooltip ?? ttl) : ttl}
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
