"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/images/ImageListEditor.tsx
 * @layer ui/studio/pages/blocks/editor/images
 *
 * @description
 * Éditeur UI générique : liste d’images (add/remove/reorder) pour les cellules
 * basées sur une collection d’images.
 *
 * @remarks
 * - S’appuie sur `useFieldArray` côté parent.
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - Les updates métier (append/remove/move) sont déléguées à RHF.
 * - Les clés React utilisent `fieldId`, alors que le DnD s’appuie
 *   sur l’`id` métier stable de chaque image.
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
import { ImageItemEditor } from "@compoz/studio/features/builder/editor/cells/images/ImageItemEditor";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { ImageEditorFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type ImageFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type ImageItemsPath = `${ImageFieldBasePath}.items`;

type ImageItemField = ImageEditorFormValues & {
  fieldId: string;
};

export type ImageListEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  basePath: ImageFieldBasePath;
  fields: ReadonlyArray<ImageItemField>;
  append: UseFieldArrayAppend<SectionBlockFormValues, ImageItemsPath>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  disabled?: boolean;
  createEmptyItem: () => ImageEditorFormValues;
  minItems?: number;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  linksEnabled?: boolean;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
}>;

export function ImageListEditor({
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
  onUploadImage,
  linksEnabled = false,
  internalPageOptions,
}: ImageListEditorProps) {
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
              const itemPrefix = `${idPrefix}-img-${item.id}`;

              return (
                <li key={item.fieldId} className="min-w-0">
                  <ImageItemEditor
                    control={control}
                    basePath={basePath}
                    index={index}
                    idPrefix={itemPrefix}
                    value={item}
                    disabled={disabled}
                    canRemove={canRemove}
                    onRemove={() => handleRemoveAt(index)}
                    showError={showError}
                    onUploadImage={onUploadImage}
                    linksEnabled={linksEnabled}
                    internalPageOptions={internalPageOptions}
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

ImageListEditor.displayName = "ImageListEditor";
