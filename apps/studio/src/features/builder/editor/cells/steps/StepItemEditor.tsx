"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/steps/StepItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/steps
 *
 * @description
 * Éditeur RHF-aware d’une étape individuelle pour StepsCell.
 *
 * @remarks
 * - Connecté directement à RHF via `useController`.
 * - Reprend le pattern card utilisé par les éditeurs de listes.
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - L’affichage des erreurs repose sur une règle unique :
 *   `showError || fieldState.isTouched`.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { StepItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type StepsFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type StepItemBasePath = `${StepsFieldBasePath}.items.${number}`;

export type StepItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: StepsFieldBasePath;
  index: number;
  idPrefix: string;
  value: StepItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
}>;

export function StepItemEditor({
  control,
  basePath,
  index,
  idPrefix,
  value,
  disabled = false,
  canRemove = true,
  onRemove,
  showError = false,
}: StepItemEditorProps) {
  const t = useTranslations();

  const itemBasePath = `${basePath}.items.${index}` as StepItemBasePath;

  const titleCtrl = useController({
    name: `${itemBasePath}.title` as `${StepItemBasePath}.title`,
    control,
  });

  const descriptionCtrl = useController({
    name: `${itemBasePath}.description` as `${StepItemBasePath}.description`,
    control,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value.id,
    disabled,
  });

  const titleIds = createFieldIds(idPrefix, "title");
  const descriptionIds = createFieldIds(idPrefix, "description");

  const shouldShowTitleError = showError || titleCtrl.fieldState.isTouched;
  const shouldShowDescriptionError =
    showError || descriptionCtrl.fieldState.isTouched;

  const titleInvalid =
    shouldShowTitleError && Boolean(titleCtrl.fieldState.error?.message);

  const titleError =
    shouldShowTitleError && titleCtrl.fieldState.error?.message
      ? String(titleCtrl.fieldState.error.message)
      : undefined;

  const descriptionInvalid =
    shouldShowDescriptionError &&
    Boolean(descriptionCtrl.fieldState.error?.message);

  const descriptionError =
    shouldShowDescriptionError && descriptionCtrl.fieldState.error?.message
      ? String(descriptionCtrl.fieldState.error.message)
      : undefined;

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn("relative h-full", STACK_MD, isDragging && "opacity-60")}
    >
      <CardContent>
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
          <DragHandle
            className={cn(disabled && "pointer-events-none opacity-50")}
            disabled={disabled}
            {...attributes}
            {...listeners}
          />

          <DeleteButton
            disabled={!canRemove || disabled}
            onConfirmDelete={onRemove}
            ariaLabel={t("common.delete")}
            title={t("common.delete")}
          />
        </div>

        <div className="pt-1">
          <div className={cn(STACK_MD)}>
            <InputField
              ids={titleIds}
              inputRef={titleCtrl.field.ref}
              label={t("studio.cellEditorTabs.stepsCellEditor.titleLabel")}
              value={String(titleCtrl.field.value ?? "")}
              onChange={(next) => {
                titleCtrl.field.onChange(next);
              }}
              onBlur={titleCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.stepsCellEditor.titlePlaceholder",
              )}
              help={t("studio.cellEditorTabs.stepsCellEditor.titleHelp")}
              invalid={titleInvalid}
              error={titleError}
            />

            <TextareaField
              ids={descriptionIds}
              label={t(
                "studio.cellEditorTabs.stepsCellEditor.descriptionLabel",
              )}
              value={String(descriptionCtrl.field.value ?? "")}
              onChange={(next) => {
                descriptionCtrl.field.onChange(next);
              }}
              onBlur={descriptionCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.stepsCellEditor.descriptionPlaceholder",
              )}
              help={t("studio.cellEditorTabs.stepsCellEditor.descriptionHelp")}
              invalid={descriptionInvalid}
              error={descriptionError}
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

StepItemEditor.displayName = "StepItemEditor";
