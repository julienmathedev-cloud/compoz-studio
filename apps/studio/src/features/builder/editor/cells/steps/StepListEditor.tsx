"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/steps/StepListEditor.tsx
 * @layer ui/studio/pages/blocks/editor/steps
 *
 * @description
 * Éditeur UI de liste d’étapes (add/remove/reorder) pour StepsCell.
 *
 * @remarks
 * - S’appuie sur `useFieldArray` côté parent (`StepsCellEditor`).
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - Les updates métier (append/remove/move) sont déléguées à RHF.
 * - Les clés React utilisent `fieldId`, alors que le DnD s’appuie
 *   sur l’`id` métier stable de chaque étape.
 * - Le reorder s’appuie sur `move()` pour conserver l’état RHF.
 * - Les valeurs live restent lues via `watchedItems` et transmises
 *   au sous-éditeur pour stabiliser le rendu pendant le rebinding.
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
import { StepItemEditor } from "@compoz/studio/features/builder/editor/cells/steps/StepItemEditor";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { StepItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type StepsFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type StepsItemsPath = `${StepsFieldBasePath}.items`;

type StepItemField = StepItemFormValues & { fieldId: string };

export type StepListEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  basePath: StepsFieldBasePath;
  fields: ReadonlyArray<StepItemField>;
  watchedItems: ReadonlyArray<StepItemFormValues>;
  append: UseFieldArrayAppend<SectionBlockFormValues, StepsItemsPath>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  disabled?: boolean;
  createEmptyItem: () => StepItemFormValues;
  minItems?: number;
  showError?: boolean;
}>;

export function StepListEditor({
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
}: StepListEditorProps) {
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
              const itemPrefix = `${idPrefix}-step-${item.id}`;
              const watchedItem = watchedItems[index];

              return (
                <li key={item.fieldId} className="min-w-0">
                  <StepItemEditor
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

StepListEditor.displayName = "StepListEditor";
