"use client";

/**
 * @file apps/studio/src/features/pages/blocks/components/molecules/PageBlockListItem.tsx
 * @layer ui/studio/pages/blocks/molecules
 *
 * @description
 * Ligne compacte pour afficher un block (type + résumé) avec des actions rapides :
 * drag, éditer, supprimer.
 *
 * @remarks
 * - Molecule UI : compose `BlockCellsDescription`, `TooltipButton`, `DeleteButton`,
 *   `StudioButtonGroup`, `DiffStatusBadge` et `DragHandle`.
 * - Les callbacks sont fournis par le parent (orchestration via hooks / sections).
 * - Supporte un état occupé local (`isDeleting`) : ARIA + désactivation cohérente.
 * - Strictement UI-only : aucune logique métier.
 */

import { useSortable } from "@dnd-kit/sortable";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { StudioButtonGroup } from "@compoz/studio/components/molecules/controls/StudioButtonGroup";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { BlockCellsDescription } from "@compoz/studio/features/pages/blocks/components/molecules/BlockCellsDescription";
import { cn } from "@compoz/ui/lib/utils";

/**
 * Props du composant `PageBlockListItem`.
 */
type PageBlockListItemProps = Readonly<{
  /** Block affiché (DTO). */
  block: BlockDTO;

  /** Status draft vs published (published / new / modified / deleted). */
  statusKind?: SiteDiffKindDTO;

  /** Action : éditer le block. */
  onEdit?: () => void;

  /** Action : suppression (confirmation + I/O gérées par le parent). */
  onDelete?: () => void;

  /** Indique une suppression en cours (désactive les actions concernées). */
  isDeleting?: boolean;

  /** Désactive toute la ligne (verrouillage global optionnel). */
  disabled?: boolean;

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
  onEdit,
  onDelete,
  isDeleting = false,
  disabled = false,
  index,
}: PageBlockListItemProps) {
  const t = useTranslations();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    disabled: disabled || isDeleting,
  });

  const isBusy = isDeleting;
  const baseDisabled = disabled || isBusy;

  const canEdit = Boolean(onEdit) && !disabled;
  const canDelete = Boolean(onDelete) && !baseDisabled;

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid min-w-0 grid-cols-[auto_max-content_minmax(0,1fr)_auto] items-center gap-3",
        isDragging && "opacity-60",
      )}
      aria-busy={isBusy || undefined}
      aria-disabled={baseDisabled || undefined}
    >
      <div className="flex items-center justify-center">
        <DragHandle
          className={cn(baseDisabled && "pointer-events-none opacity-50")}
          {...attributes}
          {...listeners}
        />
      </div>

      <div className="flex min-w-[12ch] items-center justify-center">
        {statusKind ? (
          <DiffStatusBadge
            kind={statusKind}
            publishedLabel={t("common.upToDate")}
          />
        ) : null}
      </div>

      <BlockCellsDescription block={block} index={index} />

      <div className="min-w-max shrink-0 justify-self-end">
        <StudioButtonGroup className="shrink-0">
          <TooltipButton
            type="button"
            size="icon"
            variant="default"
            visualMode="studio"
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
