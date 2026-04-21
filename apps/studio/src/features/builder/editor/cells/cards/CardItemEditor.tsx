"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/cards/CardItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cards
 *
 * @description
 * Éditeur RHF-aware d’une card individuelle pour CardsCell.
 *
 * @remarks
 * - La lecture/édition des valeurs passe par RHF (`useController`).
 * - `sortableId` sert uniquement au drag and drop.
 * - `watchedItem` sert de fallback visuel pour stabiliser le rendu
 *   pendant le rebinding RHF après reorder.
 * - L’`IconPicker` est monté à la demande pour limiter le coût de layout
 *   lorsqu’une liste contient plusieurs cards ouvertes simultanément.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { IconPicker } from "@compoz/studio/components/molecules/fields/IconPicker";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import {
  getContentIconLabel,
  renderContentIcon,
} from "@compoz/ui/lib/icons/content-icons";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type CardsFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type CardItemBasePath = `${CardsFieldBasePath}.items.${number}`;

export type CardItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: CardsFieldBasePath;
  index: number;
  idPrefix: string;
  sortableId: string;
  watchedItem?: CardItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
}>;

export function CardItemEditor({
  control,
  basePath,
  index,
  idPrefix,
  sortableId,
  watchedItem,
  disabled = false,
  canRemove = true,
  onRemove,
  showError = false,
}: CardItemEditorProps) {
  const t = useTranslations();
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const itemBasePath = `${basePath}.items.${index}` as CardItemBasePath;

  const titleCtrl = useController({
    name: `${itemBasePath}.title` as `${CardItemBasePath}.title`,
    control,
    defaultValue: watchedItem?.title ?? "",
  });

  const descriptionCtrl = useController({
    name: `${itemBasePath}.description` as `${CardItemBasePath}.description`,
    control,
    defaultValue: watchedItem?.description ?? "",
  });

  const iconCtrl = useController({
    name: `${itemBasePath}.icon` as `${CardItemBasePath}.icon`,
    control,
    defaultValue: watchedItem?.icon,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
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

  const titleValue = String(titleCtrl.field.value ?? watchedItem?.title ?? "");
  const descriptionValue = String(
    descriptionCtrl.field.value ?? watchedItem?.description ?? "",
  );
  const iconValue = iconCtrl.field.value ?? watchedItem?.icon ?? null;

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  const selectedIconPreview: ReactNode = iconValue
    ? renderContentIcon(iconValue, { className: "h-4 w-4" })
    : null;

  const selectedIconLabel = iconValue ? getContentIconLabel(iconValue) : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="default"
      visualMode="studio"
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
              label={t("studio.cellEditorTabs.cardsCellEditor.titleLabel")}
              value={titleValue}
              onChange={(next) => {
                titleCtrl.field.onChange(next);
              }}
              onBlur={titleCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.cardsCellEditor.titlePlaceholder",
              )}
              help={t("studio.cellEditorTabs.cardsCellEditor.titleHelp")}
              invalid={titleInvalid}
              error={titleError}
            />

            <TextareaField
              ids={descriptionIds}
              label={t(
                "studio.cellEditorTabs.cardsCellEditor.descriptionLabel",
              )}
              value={descriptionValue}
              onChange={(next) => {
                descriptionCtrl.field.onChange(next);
              }}
              onBlur={descriptionCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.cardsCellEditor.descriptionPlaceholder",
              )}
              help={t("studio.cellEditorTabs.cardsCellEditor.descriptionHelp")}
              invalid={descriptionInvalid}
              error={descriptionError}
              rows={4}
            />

            <div className={cn(STACK_MD)}>
              <Text as="p" className="font-medium">
                {t("studio.cellEditorTabs.cardsCellEditor.iconLabel")}
              </Text>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  {selectedIconPreview ? (
                    <>
                      {selectedIconPreview}
                      <span className="truncate">{selectedIconLabel}</span>
                    </>
                  ) : (
                    <span className="truncate">
                      {t("studio.cellEditorTabs.cardsCellEditor.iconHelp")}
                    </span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  visualMode="studio"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setIsIconPickerOpen((prev) => !prev)}
                  className="shrink-0"
                >
                  {t("common.choose")}
                  <ChevronDown
                    className={cn(
                      "ml-1 h-4 w-4 transition-transform",
                      isIconPickerOpen && "rotate-180",
                    )}
                  />
                </Button>
              </div>

              {isIconPickerOpen ? (
                <IconPicker
                  value={iconValue}
                  onChange={(next) => {
                    iconCtrl.field.onChange(next);
                  }}
                  disabled={disabled}
                />
              ) : null}

              <Text as="p" className="text-xs text-muted-foreground">
                {t("studio.cellEditorTabs.cardsCellEditor.iconHelp")}
              </Text>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

CardItemEditor.displayName = "CardItemEditor";
