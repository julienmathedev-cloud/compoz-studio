"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/card/CardListEditor.tsx
 * @layer ui/studio/pages/blocks/editor/items/card
 *
 * @description
 * UI list editor for card items with add, remove, and reorder support.
 *
 * @remarks
 * - Relies on `useFieldArray` from the parent editor.
 * - Reordering is handled by drag and drop through dnd-kit.
 * - Business updates (`append`, `remove`, `move`) are delegated to RHF.
 * - React keys use `fieldId`, while DnD relies on the stable business `id`
 *   of each card item.
 * - Reordering relies on `move()` to preserve RHF state.
 * - Live values are read through `watchedItems` and passed to the nested
 *   editor to keep rendering stable during rebinding.
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
import { CardItemEditor } from "@compoz/studio/features/builder/editor/cells/card/CardItemEditor";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type CardFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type CardItemsPath = `${CardFieldBasePath}.items`;

type CardItemField = CardItemFormValues & { fieldId: string };

export type CardListEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  basePath: CardFieldBasePath;
  fields: ReadonlyArray<CardItemField>;
  watchedItems: ReadonlyArray<CardItemFormValues>;
  append: UseFieldArrayAppend<SectionBlockFormValues, CardItemsPath>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  disabled?: boolean;
  createEmptyItem: () => CardItemFormValues;
  minItems?: number;
  showError?: boolean;
}>;

export function CardListEditor({
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
}: CardListEditorProps) {
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
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fields.map((item, index) => {
              const itemPrefix = `${idPrefix}-card-${item.id}`;
              const watchedItem = watchedItems[index];

              return (
                <li key={item.fieldId} className="min-w-0">
                  <CardItemEditor
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

CardListEditor.displayName = "CardListEditor";
