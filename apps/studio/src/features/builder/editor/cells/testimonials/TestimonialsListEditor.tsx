"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/testimonials/TestimonialsListEditor.tsx
 * @layer ui/studio/pages/blocks/editor/testimonials
 *
 * @description
 * Éditeur UI de liste de témoignages avec ajout, suppression et reorder.
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
import { TestimonialItemEditor } from "@compoz/studio/features/builder/editor/cells/testimonials/TestimonialItemEditor";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { TestimonialItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type TestimonialsFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type TestimonialsItemsPath = `${TestimonialsFieldBasePath}.items`;
type TestimonialItemField = TestimonialItemFormValues & { fieldId: string };

export type TestimonialsListEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  basePath: TestimonialsFieldBasePath;
  fields: ReadonlyArray<TestimonialItemField>;
  watchedItems: ReadonlyArray<TestimonialItemFormValues>;
  append: UseFieldArrayAppend<SectionBlockFormValues, TestimonialsItemsPath>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  disabled?: boolean;
  createEmptyItem: () => TestimonialItemFormValues;
  minItems?: number;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function TestimonialsListEditor({
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
  onUploadImage,
}: TestimonialsListEditorProps) {
  const t = useTranslations();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const canRemove = fields.length > minItems;

  const handleAdd = useCallback(() => {
    if (!disabled) append(createEmptyItem());
  }, [append, createEmptyItem, disabled]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (disabled || watchedItems.length !== fields.length) return;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = fields.findIndex((item) => item.fieldId === active.id);
      const newIndex = fields.findIndex((item) => item.fieldId === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      move(oldIndex, newIndex);
    },
    [disabled, fields, move, watchedItems.length],
  );

  return (
    <div className={cn(STACK_SM)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((item) => item.fieldId)}
          strategy={rectSortingStrategy}
        >
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {fields.map((item, index) => (
              <li key={item.fieldId} className="min-w-0">
                <TestimonialItemEditor
                  control={control}
                  basePath={basePath}
                  index={index}
                  idPrefix={`${idPrefix}-testimonial-${item.id}`}
                  sortableId={item.fieldId}
                  watchedItem={watchedItems[index]}
                  disabled={disabled}
                  canRemove={canRemove}
                  onRemove={() => {
                    if (!disabled && canRemove) remove(index);
                  }}
                  showError={showError}
                  onUploadImage={onUploadImage}
                />
              </li>
            ))}

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

TestimonialsListEditor.displayName = "TestimonialsListEditor";
