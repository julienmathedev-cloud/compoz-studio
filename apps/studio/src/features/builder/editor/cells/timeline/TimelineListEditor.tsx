"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/timeline/TimelineListEditor.tsx
 * @layer studio/features/builder/editor/cells/timeline
 *
 * @description
 * RHF-aware list editor for TimelineCell items, including add, remove, and reorder actions.
 *
 * @remarks
 * - Receives `useFieldArray` actions from `TimelineCellEditor`.
 * - Reordering is handled by dnd-kit while append/remove/move stay delegated to RHF.
 * - React keys use RHF `fieldId`; dnd-kit uses each timeline item's stable domain `id`.
 * - Uses `move()` to preserve RHF state while reordering.
 * - Guards reordering when watched item values are temporarily out of sync with fields.
 * - Passes `watchedItems` to nested editors to keep rendering stable during RHF rebinding.
 */

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type {
  Control,
  UseFieldArrayAppend,
  UseFieldArrayMove,
  UseFieldArrayRemove,
} from "react-hook-form";

import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { TimelineItemEditor } from "@compoz/studio/features/builder/editor/cells/timeline/TimelineItemEditor";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { TimelineItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type TimelineFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type TimelineItemsPath = `${TimelineFieldBasePath}.items`;

type TimelineItemField = TimelineItemFormValues & { fieldId: string };

export type TimelineListEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  basePath: TimelineFieldBasePath;
  fields: ReadonlyArray<TimelineItemField>;
  watchedItems: ReadonlyArray<TimelineItemFormValues>;
  append: UseFieldArrayAppend<SectionBlockFormValues, TimelineItemsPath>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  disabled?: boolean;
  createEmptyItem: () => TimelineItemFormValues;
  minItems?: number;
  showError?: boolean;
}>;

export function TimelineListEditor({
  control,
  idPrefix,
  basePath,
  fields,
  watchedItems,
  append,
  remove,
  move,
  disabled = false,
  createEmptyItem,
  minItems = 1,
  showError = false,
}: TimelineListEditorProps) {
  const t = useTranslations();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const canRemove = fields.length > minItems;

  const handleAdd = useCallback(() => {
    if (disabled) return;

    append(createEmptyItem());
  }, [append, createEmptyItem, disabled]);

  const handleRemoveAt = useCallback(
    (index: number) => {
      if (disabled) return;
      if (fields.length <= minItems) return;

      remove(index);
    },
    [disabled, fields.length, minItems, remove],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (disabled) return;
      if (watchedItems.length !== fields.length) return;

      const { active, over } = event;

      if (!over) return;
      if (active.id === over.id) return;

      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      move(oldIndex, newIndex);
    },
    [disabled, fields, watchedItems.length, move],
  );

  return (
    <div className={cn(STACK_SM)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <ul className="grid grid-cols-1 gap-4">
            {fields.map((item, index) => {
              const itemPrefix = `${idPrefix}-timeline-${item.id}`;
              const watchedItem = watchedItems[index];

              return (
                <li key={item.fieldId} className="min-w-0">
                  <TimelineItemEditor
                    key={`${item.fieldId}-${index}`}
                    control={control}
                    basePath={basePath}
                    index={index}
                    idPrefix={itemPrefix}
                    sortableId={item.id}
                    watchedItem={watchedItem}
                    disabled={disabled}
                    canRemove={canRemove}
                    onRemove={() => handleRemoveAt(index)}
                    showError={showError}
                  />
                </li>
              );
            })}

            <li>
              <AddEmptyCardButton
                onClick={handleAdd}
                disabled={disabled}
                ariaLabel={t("common.add")}
                tooltip={t("common.add")}
                className="h-full"
                compact
              />
            </li>
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

TimelineListEditor.displayName = "TimelineListEditor";
