"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/cards-extended/CardsExtendedListEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cards-extended
 *
 * @description
 * Éditeur UI de liste de cards étendues (add/remove/reorder) pour CardsExtendedCell.
 *
 * @remarks
 * - S’appuie sur `useFieldArray` côté parent (`CardsExtendedCellEditor`).
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - Les updates métier (append/remove/move) sont déléguées à RHF.
 * - Les clés React utilisent `fieldId`, alors que le DnD s’appuie
 *   sur l’`id` métier stable de chaque card étendue.
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
import { CardExtendedItemEditor } from "@compoz/studio/features/builder/editor/cells/cards-extended/CardExtendedItemEditor";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CardsExtendedItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type CardsExtendedFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type CardsExtendedItemsPath = `${CardsExtendedFieldBasePath}.items`;

type CardsExtendedItemField = CardsExtendedItemFormValues & { fieldId: string };

export type CardsExtendedListEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  basePath: CardsExtendedFieldBasePath;
  fields: ReadonlyArray<CardsExtendedItemField>;
  append: UseFieldArrayAppend<SectionBlockFormValues, CardsExtendedItemsPath>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  disabled?: boolean;
  createEmptyItem: () => CardsExtendedItemFormValues;
  minItems?: number;
  showError?: boolean;
}>;

export function CardExtendedListEditor({
  control,
  idPrefix,
  basePath,
  fields,
  append,
  remove,
  move,
  disabled = false,
  createEmptyItem,
  minItems = 1,
  showError = false,
}: CardsExtendedListEditorProps) {
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

      const { active, over } = event;

      if (!over) return;
      if (active.id === over.id) return;

      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      move(oldIndex, newIndex);
    },
    [disabled, fields, move],
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
              const itemPrefix = `${idPrefix}-card-extended-${item.id}`;

              return (
                <li key={item.fieldId} className="min-w-0">
                  <CardExtendedItemEditor
                    control={control}
                    basePath={basePath}
                    index={index}
                    idPrefix={itemPrefix}
                    value={item}
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

CardExtendedListEditor.displayName = "CardExtendedListEditor";
