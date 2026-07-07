"use client";

/**
 * @file apps/studio/src/features/pages/blocks/components/molecules/PageBlockListItem.tsx
 * @layer studio/features/pages/blocks/components/molecules
 *
 * @description
 * Compact sortable block list row with status, summary, edit, and delete actions.
 *
 * @remarks
 * - Uses dnd-kit `useSortable` directly so the whole row can move while `DragHandle` owns the listeners.
 * - Parent components provide edit/delete callbacks and own confirmation or I/O orchestration.
 * - Keeps the deleting state reflected through ARIA attributes and disabled actions.
 * - Splits mobile rendering into title and badge rows to keep compact block summaries readable.
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

type PageBlockListItemProps = Readonly<{
  block: BlockDTO;

  /** Status draft vs published (published / new / modified / deleted). */
  statusKind?: SiteDiffKindDTO;

  onEdit?: () => void;

  onDelete?: () => void;

  isDeleting?: boolean;

  disabled?: boolean;

  index?: number;
}>;

/** Renders a sortable block row; the parent owns list semantics. */
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
        "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3",
        "md:grid-cols-[auto_max-content_minmax(0,1fr)_auto]",
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

      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <BlockCellsDescription block={block} index={index} mode="title" />

        {statusKind ? (
          <DiffStatusBadge
            kind={statusKind}
            publishedLabel={t("common.upToDate")}
          />
        ) : null}
      </div>

      <div className="hidden min-w-[12ch] items-center justify-center md:flex">
        {statusKind ? (
          <DiffStatusBadge
            kind={statusKind}
            publishedLabel={t("common.upToDate")}
          />
        ) : null}
      </div>

      <div className="hidden min-w-0 md:block">
        <BlockCellsDescription block={block} index={index} />
      </div>

      <div className="min-w-max shrink-0 justify-self-end">
        <StudioButtonGroup className="hidden shrink-0 md:inline-flex">
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

        <DeleteButton
          size="icon"
          disabled={!canDelete}
          isDeleting={isDeleting}
          onConfirmDelete={async () => onDelete?.()}
          ariaLabel={t("studio.pageBlocksListSection.bloc.delete")}
          title={t("studio.pageBlocksListSection.bloc.delete")}
          className="md:hidden"
        />
      </div>

      <div className="col-span-3 min-w-0 pl-9 md:hidden">
        <BlockCellsDescription block={block} index={index} mode="badges" />
      </div>
    </div>
  );
}

PageBlockListItem.displayName = "PageBlockListItem";
