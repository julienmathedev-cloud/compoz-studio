"use client";

/**
 * @file apps/studio/src/features/pages/blocks/components/molecules/PageBlockListItem.tsx
 * @layer ui/studio/pages/blocks/molecules
 *
 * @description
 * Ligne compacte pour afficher un block (type + résumé) avec des actions rapides :
 * déplacer ↑/↓, éditer, supprimer.
 *
 * @remarks
 * - Molecule UI : compose `BlockCellsDescription`, `TooltipButton`, `DeleteButton`,
 *   `StudioButtonGroup` et `DiffStatusBadge`.
 * - Les callbacks sont fournis par le parent (orchestration via hooks / sections).
 * - Supporte un état occupé local (`isDeleting`) : ARIA + désactivation cohérente.
 * - Strictement UI-only : aucune logique métier.
 */

import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { StudioButtonGroup } from "@compoz/studio/components/molecules/controls/StudioButtonGroup";
import { BlockCellsDescription } from "@compoz/studio/features/pages/blocks/components/molecules/BlockCellsDescription";
import { cn } from "@compoz/ui/lib/utils";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Props du composant `PageBlockListItem`.
 */
type PageBlockListItemProps = Readonly<{
  /** Block affiché (DTO). */
  block: BlockDTO;

  /** Status draft vs published (published / new / modified / deleted). */
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
 * Ligne UI d’un block dans la liste (studio).
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
  const canEdit = Boolean(onEdit) && !disabled;
  const canDelete = Boolean(onDelete) && !baseDisabled;

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[max-content_auto_1fr_auto] items-center gap-3",
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

      <div className="shrink-0 justify-self-end">
        <StudioButtonGroup className="shrink-0">
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
            <StudioIcon icon={ChevronUp} />
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
            <StudioIcon icon={ChevronDown} />
          </TooltipButton>

          <TooltipButton
            type="button"
            size="icon"
            onClick={onEdit}
            disabled={!canEdit}
            aria-label={t("studio.pageBlocksListSection.bloc.edit")}
            tooltip={
              !canEdit
                ? t("common.actionUnavailable")
                : t("studio.pageBlocksListSection.bloc.edit")
            }
          >
            <StudioIcon icon={Pencil} />
          </TooltipButton>

          <DeleteButton
            size="icon"
            disabled={!canDelete}
            isDeleting={isDeleting}
            onConfirmDelete={async () => onDelete?.()}
            ariaLabel={t("studio.pageBlocksListSection.bloc.delete")}
            title={t("studio.pageBlocksListSection.bloc.delete")}
          />
        </StudioButtonGroup>
      </div>
    </div>
  );
}

PageBlockListItem.displayName = "PageBlockListItem";
