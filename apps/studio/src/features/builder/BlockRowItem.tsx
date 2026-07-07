"use client";

/**
 * @file apps/studio/src/features/builder/BlockRowItem.tsx
 * @layer studio/features/builder
 *
 * @description
 * Sortable Studio builder sidebar item for one block row and its nested cells.
 *
 * @remarks
 * - Manages local collapsed state without mutating it during row dragging.
 * - Uses `useSortable` for row-level sorting.
 * - Provides a dedicated cell reordering mode where each cell tile becomes draggable.
 * - Cell reordering is intentionally limited to the same column in this version.
 * - Uses a 6px pointer activation distance to avoid accidental drags while clicking controls.
 */

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { getCellKindMeta } from "@compoz/studio/lib/pages/blocks/cell-kind-meta";
import { Badge } from "@compoz/ui/components/ui/badge";
import { Button } from "@compoz/ui/components/ui/button";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import { ArrowUpDown, ChevronDown } from "lucide-react";

type BuilderRow = SectionBlockFormValues["rows"][number];
type BuilderColumn = BuilderRow["columns"][number];
type BuilderCell = BuilderColumn["cells"][number];

type BlockRowItemProps = Readonly<{
  sortableId: string;
  row: BuilderRow;
  rowLabel: string;
  selectedCellId?: string;
  isBusy: boolean;
  isSortingRows: boolean;
  onSelectCell?: (cellId: string) => void;
  onHoverCell?: (cellId: string | undefined) => void;
  onRemoveRow: (rowId: string) => void | Promise<void>;
  onSetRowColumnsCount: (
    rowId: string,
    next: 1 | 2 | 3,
  ) => void | Promise<void>;
  onToggleReverseOnMobile: (rowId: string, checked: boolean) => void;
  onAddCell: (rowId: string, columnId: string) => void;
  onMoveCell: (args: {
    rowId: string;
    columnId: string;
    activeCellId: string;
    overCellId: string;
  }) => void | Promise<void>;
}>;

const COLUMNS_COUNT_OPTIONS = [1, 2, 3] as const;

export function BlockRowItem({
  sortableId,
  row,
  rowLabel,
  selectedCellId,
  isBusy,
  isSortingRows,
  onSelectCell,
  onHoverCell,
  onRemoveRow,
  onSetRowColumnsCount,
  onToggleReverseOnMobile,
  onAddCell,
  onMoveCell,
}: BlockRowItemProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(true);
  const [isSortingCells, setIsSortingCells] = useState(false);
  const contentId = useId();
  const reverseOnMobileIds = createFieldIds(
    `builder-row-${row.id}`,
    "reverse-on-mobile",
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled: isBusy,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const effectiveOpen = open && !isSortingRows;
  const toggleDisabled = isBusy || isSortingRows;

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  const cellColumnById = useMemo(() => {
    const map = new Map<string, string>();

    row.columns.forEach((column) => {
      column.cells.forEach((cell) => {
        map.set(cell.id, column.id);
      });
    });

    return map;
  }, [row.columns]);

  const handleCellsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!isSortingCells || isBusy) return;
    if (!over) return;
    if (active.id === over.id) return;

    const activeCellId = String(active.id);
    const overCellId = String(over.id);

    const activeColumnId = cellColumnById.get(activeCellId);
    const overColumnId = cellColumnById.get(overCellId);

    if (!activeColumnId || !overColumnId) return;
    if (activeColumnId !== overColumnId) return;

    await onMoveCell({
      rowId: row.id,
      columnId: activeColumnId,
      activeCellId,
      overCellId,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(STACK_SM, isDragging && "opacity-60")}
      aria-disabled={isBusy || undefined}
    >
      <div className="flex items-start gap-2">
        <div className="flex self-stretch items-center pb-1">
          <DragHandle
            className={cn(isBusy && "pointer-events-none opacity-50")}
            disabled={isBusy}
            {...attributes}
            {...listeners}
          />
        </div>

        <button
          type="button"
          aria-expanded={effectiveOpen}
          aria-controls={contentId}
          disabled={toggleDisabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left",
            "outline-none transition-colors",
            !toggleDisabled && "hover:bg-secondary/50",
            "focus-visible:ring-2 focus-visible:ring-ring/70",
            toggleDisabled && "cursor-not-allowed opacity-60",
          )}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              !effectiveOpen && "-rotate-90",
            )}
            aria-hidden="true"
          />

          <Text as="p" className="truncate font-medium">
            {rowLabel}
          </Text>
        </button>

        <DeleteButton
          size="icon"
          disabled={isBusy}
          onConfirmDelete={async () => onRemoveRow(row.id)}
          ariaLabel={t("common.delete")}
          title={t("common.delete")}
        />
      </div>

      {effectiveOpen ? (
        <div id={contentId} className={cn(STACK_SM, "px-2")}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Text as="p" variant="meta" className="font-medium">
                {t("studio.builder.sidebar.rows.columnsCountLabel")}
              </Text>

              <div className="flex items-center gap-0.5">
                {COLUMNS_COUNT_OPTIONS.map((count) => (
                  <Button
                    key={count}
                    type="button"
                    size="sm"
                    variant={row.columnsCount === count ? "default" : "ghost"}
                    visualMode="studio"
                    onClick={() => void onSetRowColumnsCount(row.id, count)}
                    disabled={isBusy}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            <TooltipButton
              type="button"
              size="icon"
              variant={isSortingCells ? "default" : "ghost"}
              visualMode="studio"
              tooltip={t("studio.builder.sidebar.rows.reorderCells")}
              aria-label={t("studio.builder.sidebar.rows.reorderCells")}
              onClick={() => setIsSortingCells((prev) => !prev)}
              disabled={isBusy}
            >
              <ArrowUpDown className="h-4 w-4" />
            </TooltipButton>
          </div>

          <SwitchField
            ids={reverseOnMobileIds}
            label={t("studio.builder.sidebar.rows.reverseOnMobile.label")}
            help={t("studio.builder.sidebar.rows.reverseOnMobile.help")}
            checked={Boolean(row.reverseOn.mobile)}
            onCheckedChange={(checked) => {
              onToggleReverseOnMobile(row.id, checked);
            }}
            disabled={isBusy}
          />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCellsDragEnd}
          >
            <div
              className={cn(
                "mx-auto grid w-fit justify-center gap-3",
                row.columnsCount === 1 && "grid-cols-1",
                row.columnsCount === 2 && "grid-cols-2",
                row.columnsCount === 3 && "grid-cols-3",
              )}
            >
              {row.columns.map((column, columnIndex) => (
                <div
                  key={column.id}
                  className={cn(
                    "flex w-[90px] flex-col items-center space-y-3 rounded-md border p-3 text-center",
                    isSortingCells && "border-dashed border-primary/40",
                  )}
                >
                  <Text as="p" variant="meta" className="font-medium">
                    {t("studio.cellEditorTabs.tabs", {
                      number: columnIndex + 1,
                    })}
                  </Text>

                  <SortableContext
                    items={column.cells.map((cell) => cell.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col items-center">
                      {column.cells.length > 0 ? (
                        column.cells.map((cell) => {
                          const meta = getCellKindMeta(cell.kind, t);
                          const isSelected = selectedCellId === cell.id;

                          return (
                            <SortableCellTile
                              key={cell.id}
                              cell={cell}
                              label={meta.label}
                              Icon={meta.Icon}
                              disabled={isBusy}
                              isSelected={isSelected}
                              isSortingCells={isSortingCells}
                              onSelect={() => onSelectCell?.(cell.id)}
                              onHoverChange={(hovered) => {
                                onHoverCell?.(hovered ? cell.id : undefined);
                              }}
                            />
                          );
                        })
                      ) : (
                        <Badge variant="info" visualMode="studio">
                          {t("studio.pageBlocksListSection.bloc.empty")}
                        </Badge>
                      )}
                    </div>
                  </SortableContext>

                  <AddEmptyCardButton
                    onClick={() => onAddCell(row.id, column.id)}
                    disabled={isBusy || isSortingCells}
                    ariaLabel={t("studio.builder.sidebar.rows.addCell")}
                    tooltip={t("studio.builder.sidebar.rows.addCell")}
                    className="w-[50px]"
                    compact
                  />
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      ) : null}
    </div>
  );
}

BlockRowItem.displayName = "BlockRowItem";

// Internal sortable cell tile.

type SortableCellTileProps = Readonly<{
  cell: BuilderCell;
  label: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  disabled: boolean;
  isSelected: boolean;
  isSortingCells: boolean;
  onSelect: () => void;
  onHoverChange: (hovered: boolean) => void;
}>;

function SortableCellTile({
  cell,
  label,
  Icon,
  disabled,
  isSelected,
  isSortingCells,
  onSelect,
  onHoverChange,
}: SortableCellTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cell.id,
    disabled: disabled || !isSortingCells,
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <TooltipButton
      ref={setNodeRef}
      type="button"
      onClick={
        isSortingCells
          ? undefined
          : (event) => {
              event.currentTarget.blur();
              onSelect();
            }
      }
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      disabled={disabled}
      variant={isSelected ? "default" : "ghost"}
      visualMode="studio"
      tooltip={label}
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center p-0",
        disabled && "cursor-not-allowed opacity-60",
        isSortingCells && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
      style={style}
      {...(isSortingCells ? attributes : {})}
      {...(isSortingCells ? listeners : {})}
    >
      <Icon className="h-4 w-4" aria-hidden={true} />
      <span className="sr-only">{label}</span>
    </TooltipButton>
  );
}
