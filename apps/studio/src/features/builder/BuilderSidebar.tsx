"use client";

/**
 * @file apps/studio/src/features/builder/BuilderSidebar.tsx
 * @layer ui/studio/builder
 *
 * @description
 * Panneau latéral du builder Studio.
 *
 * @remarks
 * - Panneau simple (sans Sidebar Shadcn).
 * - Header fixe sans badge de statut.
 * - Infos globales du block en zone fixe.
 * - ScrollArea dédiée uniquement à la liste des rows.
 * - Footer avec ActionsBar fixé en bas dans la même surface visuelle.
 * - Ne dépend plus de `useFormContext()` :
 *   le parent passe explicitement `control`, `setValue` et `clearErrors`.
 */

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Control,
  UseFormClearErrors,
  UseFormSetValue,
} from "react-hook-form";
import { Controller, useFormState, useWatch } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { BlockRowItem } from "@compoz/studio/features/builder/BlockRowItem";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import {
  createEmptyColumn,
  createEmptyRow,
  normalizeSectionBlockFormValues,
} from "@compoz/studio/features/pages/mappers/blocks-form";
import { createEmptyCell } from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { ScrollArea } from "@compoz/ui/components/ui/scroll-area";
import { Separator } from "@compoz/ui/components/ui/separator";
import { moveItem } from "@compoz/ui/lib/array";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type {
  CellFormValues,
  RichTextCellFormValues,
} from "@compoz/validation/pages/blocks/cells/cell-form";
import { ArrowLeft } from "lucide-react";

type BuilderRow = SectionBlockFormValues["rows"][number];
type BuilderColumn = BuilderRow["columns"][number];

type BuilderSidebarProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  setValue: UseFormSetValue<SectionBlockFormValues>;
  clearErrors: UseFormClearErrors<SectionBlockFormValues>;
  title?: string;
  idPrefix?: string;
  isSaving?: boolean;
  isDirty?: boolean;
  selectedCellId?: string;
  onSelectCell?: (cellId: string) => void;
  onHoverCell?: (cellId: string | undefined) => void;
  onReset: () => void;
  onBack: () => void;
}>;

const CONTAINER_MODES = [
  "contained",
  "fullBleed",
] as const satisfies ReadonlyArray<SectionBlockFormValues["containerMode"]>;

function hasMeaningfulRichTextContent(html: string): boolean {
  if (!html) return false;

  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return text.length > 0;
}

function shouldGuardCellOnColumnsReduce(cell: CellFormValues): boolean {
  if (!cell || typeof cell !== "object") return false;

  if (cell.kind === "richText") {
    return hasMeaningfulRichTextContent(
      (cell as RichTextCellFormValues).content ?? "",
    );
  }

  return true;
}

function hasMeaningfulColumnContent(column: BuilderColumn): boolean {
  return column.cells.some((cell) => shouldGuardCellOnColumnsReduce(cell));
}

function wouldLoseContentOnColumnsReduce(args: {
  row: BuilderRow;
  nextColumnsCount: 1 | 2 | 3;
}): boolean {
  const { row, nextColumnsCount } = args;

  if (nextColumnsCount >= row.columnsCount) return false;

  const removedColumns = row.columns.slice(nextColumnsCount);
  return removedColumns.some((column) => hasMeaningfulColumnContent(column));
}

function resizeColumns(
  row: BuilderRow,
  nextColumnsCount: 1 | 2 | 3,
): BuilderRow {
  if (row.columnsCount === nextColumnsCount) return row;

  if (nextColumnsCount > row.columns.length) {
    const missing = nextColumnsCount - row.columns.length;

    return {
      ...row,
      columnsCount: nextColumnsCount,
      columns: [
        ...row.columns,
        ...Array.from({ length: missing }, () => createEmptyColumn()),
      ],
    };
  }

  return {
    ...row,
    columnsCount: nextColumnsCount,
    columns: row.columns.slice(0, nextColumnsCount),
  };
}

export function BuilderSidebar({
  control,
  setValue,
  clearErrors,
  title,
  idPrefix = "builder-sidebar",
  isSaving,
  isDirty = false,
  selectedCellId,
  onSelectCell,
  onHoverCell,
  onReset,
  onBack,
}: BuilderSidebarProps) {
  const t = useTranslations();
  const confirmList = useConfirmList();

  const [isSortingRows, setIsSortingRows] = useState(false);

  const { isSubmitting, submitCount, touchedFields, errors } = useFormState({
    control,
  });

  const watchedAll = useWatch({ control }) as
    | SectionBlockFormValues
    | undefined;

  const watchedRows = useWatch({
    control,
    name: "rows",
  }) as SectionBlockFormValues["rows"] | undefined;

  const liveValues = useMemo(() => {
    return normalizeSectionBlockFormValues(
      watchedAll ?? {
        name: "",
        containerMode: "contained",
        lcpPriority: false,
        rows: [],
      },
    );
  }, [watchedAll]);

  useEffect(() => {
    const rawRows = watchedRows ?? [];
    const normalizedRows = liveValues.rows;

    const needsBackfill =
      rawRows.length !== normalizedRows.length ||
      rawRows.some((row, rowIndex) => {
        const normalizedRow = normalizedRows[rowIndex];
        if (!normalizedRow) return true;

        if (String(row?.id ?? "").trim() !== normalizedRow.id) {
          return true;
        }

        const rawColumns = row?.columns ?? [];
        const normalizedColumns = normalizedRow.columns ?? [];

        if (rawColumns.length !== normalizedColumns.length) {
          return true;
        }

        return rawColumns.some((column, columnIndex) => {
          const normalizedColumn = normalizedColumns[columnIndex];
          if (!normalizedColumn) return true;

          return String(column?.id ?? "").trim() !== normalizedColumn.id;
        });
      });

    if (!needsBackfill) return;

    setValue("rows", normalizedRows, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [liveValues.rows, setValue, watchedRows]);

  const isBusy = Boolean(isSaving || isSubmitting);

  const nameIds = createFieldIds(idPrefix, "name");
  const lcpPriorityIds = createFieldIds(idPrefix, "lcp-priority");

  const nameTouched = Boolean(touchedFields.name);
  const shouldShowNameError = nameTouched || submitCount > 0;
  const nameErrorMessage =
    shouldShowNameError && errors.name?.message
      ? String(errors.name.message)
      : undefined;

  const handleAddRow = useCallback(() => {
    if (isBusy) return;

    const nextRows = [...liveValues.rows, createEmptyRow({ columnsCount: 1 })];

    setValue("rows", nextRows, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [isBusy, liveValues.rows, setValue]);

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      if (isBusy) return;

      const nextRows = liveValues.rows.filter((row) => row.id !== rowId);

      setValue("rows", nextRows, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    },
    [isBusy, liveValues.rows, setValue],
  );

  const handleSetRowColumnsCount = useCallback(
    async (rowId: string, next: 1 | 2 | 3) => {
      if (isBusy) return;

      const currentRow = liveValues.rows.find((row) => row.id === rowId);
      if (!currentRow) return;
      if (next === currentRow.columnsCount) return;

      const isDestructive =
        isDirty &&
        wouldLoseContentOnColumnsReduce({
          row: currentRow,
          nextColumnsCount: next,
        });

      if (isDestructive) {
        const ok = await confirmList({
          title: t("studio.shared.confirm.destructiveChange.title"),
          intro: t("studio.shared.confirm.destructiveChange.intro"),
          items: [],
          confirmLabel: t(
            "studio.shared.confirm.destructiveChange.confirmLabel",
          ),
          cancelLabel: t("studio.shared.confirm.destructiveChange.cancelLabel"),
          requireAckLabel: t(
            "studio.shared.confirm.destructiveChange.requireAckLabel",
          ),
          tone: "default",
        });

        if (!ok) return;
      }

      const nextRows = liveValues.rows.map((row) =>
        row.id === rowId ? resizeColumns(row, next) : row,
      );

      clearErrors("rows");

      setValue("rows", nextRows, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    },
    [clearErrors, confirmList, isBusy, isDirty, liveValues.rows, setValue, t],
  );

  const handleToggleReverseOnMobile = useCallback(
    (rowId: string, checked: boolean) => {
      if (isBusy) return;

      const nextRows = liveValues.rows.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          reverseOn: {
            ...row.reverseOn,
            mobile: checked,
          },
        };
      });

      setValue("rows", nextRows, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    },
    [isBusy, liveValues.rows, setValue],
  );

  const handleAddCell = useCallback(
    (rowId: string, columnId: string) => {
      if (isBusy) return;

      const nextRows = liveValues.rows.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          columns: row.columns.map((column) => {
            if (column.id !== columnId) return column;

            return {
              ...column,
              cells: [...column.cells, createEmptyCell("richText")],
            };
          }),
        };
      });

      setValue("rows", nextRows, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    },
    [isBusy, liveValues.rows, setValue],
  );

  const handleMoveCell = useCallback(
    (args: {
      rowId: string;
      columnId: string;
      activeCellId: string;
      overCellId: string;
    }) => {
      if (isBusy) return;

      const { rowId, columnId, activeCellId, overCellId } = args;

      const nextRows = liveValues.rows.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          columns: row.columns.map((column) => {
            if (column.id !== columnId) return column;

            const oldIndex = column.cells.findIndex(
              (cell) => cell.id === activeCellId,
            );
            const newIndex = column.cells.findIndex(
              (cell) => cell.id === overCellId,
            );

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
              return column;
            }

            return {
              ...column,
              cells: moveItem(column.cells, oldIndex, newIndex),
            };
          }),
        };
      });

      setValue("rows", nextRows, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    },
    [isBusy, liveValues.rows, setValue],
  );

  const handleRowDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsSortingRows(false);

      const { active, over } = event;

      if (!over) return;
      if (active.id === over.id) return;
      if (isBusy) return;

      const oldIndex = liveValues.rows.findIndex((row) => row.id === active.id);
      const newIndex = liveValues.rows.findIndex((row) => row.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;
      if (oldIndex === newIndex) return;

      const nextRows = moveItem(liveValues.rows, oldIndex, newIndex);

      clearErrors("rows");

      setValue("rows", nextRows, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    },
    [clearErrors, isBusy, liveValues.rows, setValue],
  );

  return (
    <aside className="flex h-full w-[330px] flex-col bg-sidebar">
      <div className="grid h-10 shrink-0 grid-cols-[40px_1fr_40px] items-center px-2">
        <div className="flex items-center justify-start">
          <Button
            type="button"
            variant="header"
            visualMode="studio"
            size="icon"
            onClick={onBack}
            disabled={isBusy}
          >
            <ArrowLeft />
          </Button>
        </div>

        <div className="flex min-w-0 items-center justify-center">
          <Text className="truncate text-center text-2xl font-bold tracking-tighter text-foreground">
            {title ?? "Compoz Studio"}
          </Text>
        </div>

        <div aria-hidden="true" />
      </div>

      <div className="ml-2 mb-2 flex min-h-0 flex-1 flex-col rounded-sm border border-primary/10 bg-background">
        <div className="shrink-0 space-y-4 px-4 py-4">
          <div className={cn(STACK_SM)}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField
                  ids={nameIds}
                  label={t("studio.builder.sidebar.section.name.label")}
                  help={t("studio.builder.sidebar.section.name.help")}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value)}
                  onBlur={field.onBlur}
                  placeholder={t(
                    "studio.builder.sidebar.section.name.placeholder",
                  )}
                  maxLength={120}
                  showCount
                  disabled={isBusy}
                  invalid={Boolean(nameErrorMessage)}
                  error={nameErrorMessage}
                />
              )}
            />

            <div className={cn(STACK_SM)}>
              <Text as="p">
                {t("studio.builder.sidebar.section.containerMode.label")}
              </Text>

              <div className="flex items-center gap-0.5">
                {CONTAINER_MODES.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={
                      liveValues.containerMode === mode ? "default" : "ghost"
                    }
                    visualMode="studio"
                    onClick={() =>
                      setValue("containerMode", mode, {
                        shouldDirty: true,
                        shouldTouch: false,
                        shouldValidate: false,
                      })
                    }
                    disabled={isBusy}
                  >
                    {t(
                      `studio.builder.sidebar.section.containerMode.options.${mode}`,
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <Controller
              name="lcpPriority"
              control={control}
              render={({ field }) => (
                <SwitchField
                  ids={lcpPriorityIds}
                  label={t("studio.builder.sidebar.section.lcpPriority.label")}
                  help={t("studio.builder.sidebar.section.lcpPriority.help")}
                  checked={Boolean(field.value)}
                  onCheckedChange={(value) => {
                    field.onChange(Boolean(value));
                  }}
                  disabled={isBusy}
                />
              )}
            />
          </div>

          <Separator />
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-4 pb-4">
            <div className={cn(STACK_SM)}>
              <DndContext
                collisionDetection={closestCenter}
                onDragStart={() => {
                  setIsSortingRows(true);
                }}
                onDragCancel={() => {
                  setIsSortingRows(false);
                }}
                onDragEnd={handleRowDragEnd}
              >
                <SortableContext
                  items={liveValues.rows.map((row) => row.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {liveValues.rows.map((row, rowIndex) => (
                    <div key={row.id} className={cn(STACK_SM)}>
                      <BlockRowItem
                        sortableId={row.id}
                        row={row}
                        rowLabel={t("studio.builder.sidebar.rows.rowLabel", {
                          index: rowIndex + 1,
                        })}
                        selectedCellId={selectedCellId}
                        isBusy={isBusy}
                        isSortingRows={isSortingRows}
                        onSelectCell={onSelectCell}
                        onHoverCell={onHoverCell}
                        onRemoveRow={handleRemoveRow}
                        onSetRowColumnsCount={handleSetRowColumnsCount}
                        onToggleReverseOnMobile={handleToggleReverseOnMobile}
                        onAddCell={handleAddCell}
                        onMoveCell={handleMoveCell}
                      />
                      <Separator />
                    </div>
                  ))}
                </SortableContext>
              </DndContext>

              <AddEmptyCardButton
                onClick={handleAddRow}
                disabled={isBusy}
                ariaLabel={t("studio.builder.sidebar.rows.add")}
                tooltip={t("studio.builder.sidebar.rows.add")}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t p-4">
          <ActionsBar
            variant="resetSubmit"
            isSaving={isBusy}
            isDirty={isDirty}
            onReset={onReset}
          />
        </div>
      </div>
    </aside>
  );
}

BuilderSidebar.displayName = "BuilderSidebar";
