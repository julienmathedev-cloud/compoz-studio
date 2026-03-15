"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/case-study-card/CaseStudyCardListEditor.tsx
 * @layer ui/studio/pages/blocks/editor/case-study-card
 *
 * @description
 * Éditeur UI de liste de case studies (add/remove/reorder) pour CaseStudyCardCell.
 *
 * @remarks
 * - S’appuie sur `useFieldArray` côté parent (`CaseStudyCardCellEditor`).
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - Les updates métier (append/remove/move) sont déléguées à RHF.
 * - Les clés React utilisent `fieldId`, alors que le DnD s’appuie
 *   sur l’`id` métier stable de chaque item.
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
import { CaseStudyCardItemEditor } from "@compoz/studio/features/builder/editor/cells/case-study-card/CaseStudyCardItemEditor";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CaseStudyCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type CaseStudyCardFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type CaseStudyCardItemsPath = `${CaseStudyCardFieldBasePath}.items`;

type CaseStudyCardItemField = CaseStudyCardItemFormValues & {
  fieldId: string;
};

export type CaseStudyCardListEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  basePath: CaseStudyCardFieldBasePath;
  fields: ReadonlyArray<CaseStudyCardItemField>;
  append: UseFieldArrayAppend<SectionBlockFormValues, CaseStudyCardItemsPath>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  disabled?: boolean;
  createEmptyItem: () => CaseStudyCardItemFormValues;
  minItems?: number;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function CaseStudyCardListEditor({
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
}: CaseStudyCardListEditorProps) {
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
              const itemPrefix = `${idPrefix}-case-study-card-${item.id}`;

              return (
                <li key={item.fieldId} className="min-w-0">
                  <CaseStudyCardItemEditor
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

CaseStudyCardListEditor.displayName = "CaseStudyCardListEditor";
