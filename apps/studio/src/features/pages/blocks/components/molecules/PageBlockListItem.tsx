"use client";

/**
 * @file apps/studio/src/features/pages/blocks/components/molecules/PageBlockListItem.tsx
 * @layer ui/molecules
 *
 * @description
 * Ligne compacte pour afficher un block (type + résumé) avec des actions rapides :
 * déplacer ↑/↓, éditer, supprimer.
 *
 * @remarks
 * - Molecule UI : compose `Text`, `TooltipButton`, `DeleteButton`, `AdminButtonGroup`.
 * - Les callbacks sont fournis par le parent (orchestration via hooks/sections).
 * - Supporte un état occupé local (`isBusy`) : ARIA + désactivation cohérente.
 * - Strictement UI-only : aucune logique métier.
 */

import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { AdminButtonGroup } from "@compoz/studio/components/molecules/controls/AdminButtonGroup";

import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { cn } from "@compoz/ui/lib/utils";

import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { BlockCellsDescription } from "@compoz/studio/features/pages/blocks/components/molecules/BlockCellsDescription";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Props du composant `PageBlockListItem`.
 */
type PageBlockListItemProps = Readonly<{
  /** Block affiché (DTO). */
  block: BlockDTO;

  /** Status draft vs published (clean/new/dirty/deleted). */
  statusKind?: SiteDiffKindDTO;

  /** Action : déplacement vers le haut. */
  onMoveUp?: () => void;

  /** Action : déplacement vers le bas. */
  onMoveDown?: () => void;

  /** Action : éditer le block. */
  onEdit?: () => void;

  /** Action : suppression (confirmation + I/O gérées par le parent). */
  onDelete?: () => void;

  /** Indique une suppression en cours (désactive les actions concernées). */
  isDeleting?: boolean;

  /** Désactive toute la ligne (verrouillage global optionnel). */
  disabled?: boolean;

  /** Indique si l’item est en première position. */
  isFirst?: boolean;

  /** Indique si l’item est en dernière position. */
  isLast?: boolean;

  /** Indice du bloc dans la liste (pour le titre). */
  index?: number;
}>;

/**
 * Ligne UI d’un block dans la liste (admin).
 *
 * @remarks
 * Ne rend pas de `<li>` : le conteneur parent gère la sémantique de liste.
 */
export function PageBlockListItem({
  block,
  statusKind,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  isDeleting = false,
  disabled = false,
  isFirst = false,
  isLast = false,
  index,
}: PageBlockListItemProps) {
  const t = useTranslations();

  const isBusy = isDeleting;
  const baseDisabled = disabled || isBusy;

  const canMoveUp = Boolean(onMoveUp) && !baseDisabled && !isFirst;
  const canMoveDown = Boolean(onMoveDown) && !baseDisabled && !isLast;

  // UX : on autorise l’edit même si "busy delete" n’est pas actif,
  // mais on respecte un verrou global.
  const canEdit = Boolean(onEdit) && !disabled;

  const canDelete = Boolean(onDelete) && !baseDisabled;

  return (
    <div
      className={cn(
        "grid items-center gap-3",
        "grid-cols-[max-content_auto_1fr_auto]",
        "min-w-0",
      )}
      aria-busy={isBusy || undefined}
      aria-disabled={baseDisabled || undefined}
    >
      <div className="flex min-w-[12ch] items-center justify-center">
        {statusKind ? (
          <DiffStatusBadge
            kind={statusKind}
            publishedLabel={t("common.upToDate")}
          />
        ) : null}
      </div>

      <BlockCellsDescription block={block} index={index} />

      {/* Bloc droit : actions groupées */}
      <div className="shrink-0 justify-self-end">
        <AdminButtonGroup className="shrink-0">
          <TooltipButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={t("common.moveUp")}
            tooltip={
              !canMoveUp
                ? disabled
                  ? t("common.actionUnavailable")
                  : isFirst
                    ? t("common.alreadyTop")
                    : t("common.actionUnavailable")
                : t("common.moveUp")
            }
          >
            <AdminIcon icon={ChevronUp} />
          </TooltipButton>

          <TooltipButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={t("common.moveDown")}
            tooltip={
              !canMoveDown
                ? disabled
                  ? t("common.actionUnavailable")
                  : isLast
                    ? t("common.alreadyBottom")
                    : t("common.actionUnavailable")
                : t("common.moveDown")
            }
          >
            <AdminIcon icon={ChevronDown} />
          </TooltipButton>

          <TooltipButton
            type="button"
            size="icon"
            onClick={onEdit}
            disabled={!canEdit}
            aria-label={t("admin.pageBlocksListSection.bloc.edit")}
            tooltip={
              !canEdit
                ? t("common.actionUnavailable")
                : t("admin.pageBlocksListSection.bloc.edit")
            }
          >
            <AdminIcon icon={Pencil} />
          </TooltipButton>

          <DeleteButton
            disabled={!canDelete}
            isDeleting={isDeleting}
            size="icon"
            onConfirmDelete={async () => onDelete?.()}
            ariaLabel={t("admin.pageBlocksListSection.bloc.delete")}
            title={t("admin.pageBlocksListSection.bloc.delete")}
          />
        </AdminButtonGroup>
      </div>
    </div>
  );
}

PageBlockListItem.displayName = "PageBlockListItem";
