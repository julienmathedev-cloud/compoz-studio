"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/extended-card/ExtendedCardItemEditor.tsx
 * @layer studio/features/builder/editor/cells/extended-card
 *
 * @description
 * RHF-aware editor for one ExtendedCardCell item.
 *
 * @remarks
 * - Binds item fields directly through RHF `useController`.
 * - Uses `sortableId` only for dnd-kit sorting.
 * - Shows title and description errors only after `showError` or the field has been touched.
 * - Uses `watchedItem` as a visual fallback to keep rendering stable during RHF rebinding after reordering.
 * - Mounts `IconPicker` on demand to reduce layout cost when several cards are open.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import type { Control, FieldPath } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { IconPicker } from "@compoz/studio/components/molecules/fields/IconPicker";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import {
  getContentIconLabel,
  renderContentIcon,
} from "@compoz/ui/lib/icons/content-icons";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { ExtendedCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type ExtendedCardFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type ExtendedCardItemBasePath = `${ExtendedCardFieldBasePath}.items.${number}`;

type SectionBlockFieldPath = FieldPath<SectionBlockFormValues>;

export type ExtendedCardItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: ExtendedCardFieldBasePath;
  index: number;
  idPrefix: string;
  sortableId: string;
  watchedItem?: ExtendedCardItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
}>;

function toSectionBlockFieldPath(path: string): SectionBlockFieldPath {
  return path as SectionBlockFieldPath;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function ExtendedCardItemEditor({
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
}: ExtendedCardItemEditorProps) {
  const t = useTranslations();
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const itemBasePath = `${basePath}.items.${index}` as ExtendedCardItemBasePath;

  const titleCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.title`),
    control,
    defaultValue: watchedItem?.title ?? "",
  });

  const descriptionCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.description`),
    control,
    defaultValue: watchedItem?.description ?? "",
  });

  const iconCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.icon`),
    control,
    defaultValue: watchedItem?.icon ?? null,
  });

  const footerCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.footer`),
    control,
    defaultValue: watchedItem?.footer ?? "",
  });

  const bulletsCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.bullets`),
    control,
    defaultValue: watchedItem?.bullets ?? [],
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
  const footerIds = createFieldIds(idPrefix, "footer");
  const bulletsIds = createFieldIds(idPrefix, "bullets");

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
  const footerValue = String(
    footerCtrl.field.value ?? watchedItem?.footer ?? "",
  );

  const bulletsArray = Array.isArray(bulletsCtrl.field.value)
    ? bulletsCtrl.field.value
    : Array.isArray(watchedItem?.bullets)
      ? watchedItem.bullets
      : [];

  const bulletsValue = bulletsArray.join("\n");

  const iconValue: string | null =
    toNullableString(iconCtrl.field.value) ??
    toNullableString(watchedItem?.icon) ??
    null;

  const selectedIconPreview: ReactNode = iconValue
    ? renderContentIcon(iconValue, { className: "h-4 w-4" })
    : null;

  const selectedIconLabel = iconValue ? getContentIconLabel(iconValue) : null;

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

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
              label={t(
                "studio.cellEditorTabs.extendedCardCellEditor.titleLabel",
              )}
              value={titleValue}
              onChange={(next) => {
                titleCtrl.field.onChange(next);
              }}
              onBlur={titleCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.extendedCardCellEditor.titlePlaceholder",
              )}
              help={t("studio.cellEditorTabs.extendedCardCellEditor.titleHelp")}
              invalid={titleInvalid}
              error={titleError}
            />

            <TextareaField
              ids={descriptionIds}
              label={t(
                "studio.cellEditorTabs.extendedCardCellEditor.descriptionLabel",
              )}
              value={descriptionValue}
              onChange={(next) => {
                descriptionCtrl.field.onChange(next);
              }}
              onBlur={descriptionCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.extendedCardCellEditor.descriptionPlaceholder",
              )}
              help={t(
                "studio.cellEditorTabs.extendedCardCellEditor.descriptionHelp",
              )}
              invalid={descriptionInvalid}
              error={descriptionError}
              rows={4}
            />

            <TextareaField
              ids={bulletsIds}
              label={t(
                "studio.cellEditorTabs.extendedCardCellEditor.bulletsLabel",
              )}
              value={bulletsValue}
              onChange={(next) => {
                const parsedBullets = next.split("\n");
                bulletsCtrl.field.onChange(parsedBullets);
              }}
              onBlur={() => {
                const rawBullets = Array.isArray(bulletsCtrl.field.value)
                  ? bulletsCtrl.field.value
                  : [];

                const normalizedBullets = rawBullets
                  .map((bullet) => String(bullet).trim())
                  .filter((bullet) => bullet.length > 0);

                bulletsCtrl.field.onChange(normalizedBullets);
                bulletsCtrl.field.onBlur();
              }}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.extendedCardCellEditor.bulletsPlaceholder",
              )}
              help={t(
                "studio.cellEditorTabs.extendedCardCellEditor.bulletsHelp",
              )}
              rows={5}
            />

            <InputField
              ids={footerIds}
              inputRef={footerCtrl.field.ref}
              label={t(
                "studio.cellEditorTabs.extendedCardCellEditor.footerLabel",
              )}
              value={footerValue}
              onChange={(next) => {
                footerCtrl.field.onChange(next);
              }}
              onBlur={footerCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.extendedCardCellEditor.footerPlaceholder",
              )}
              help={t(
                "studio.cellEditorTabs.extendedCardCellEditor.footerHelp",
              )}
            />

            <div className={cn(STACK_MD)}>
              <Text as="p">
                {t("studio.cellEditorTabs.extendedCardCellEditor.iconLabel")}
              </Text>

              <button
                type="button"
                disabled={disabled}
                onClick={() => setIsIconPickerOpen((prev) => !prev)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left",
                  "transition-colors hover:bg-accent/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
                  disabled && "cursor-not-allowed opacity-60",
                )}
                aria-expanded={isIconPickerOpen}
                aria-label={t(
                  "studio.cellEditorTabs.extendedCardCellEditor.iconLabel",
                )}
              >
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  {selectedIconPreview ? (
                    <>
                      {selectedIconPreview}

                      <Text as="span" className="truncate">
                        {selectedIconLabel}
                      </Text>
                    </>
                  ) : (
                    <Text as="span" className="truncate">
                      {t(
                        "studio.cellEditorTabs.extendedCardCellEditor.iconHelp",
                      )}
                    </Text>
                  )}
                </div>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    isIconPickerOpen && "rotate-180",
                  )}
                />
              </button>

              {isIconPickerOpen ? (
                <IconPicker
                  value={iconValue}
                  onChange={(next) => {
                    iconCtrl.field.onChange(next);
                  }}
                  disabled={disabled}
                />
              ) : null}

              <Text as="p" variant="meta">
                {t("studio.cellEditorTabs.extendedCardCellEditor.iconHelp")}
              </Text>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

ExtendedCardItemEditor.displayName = "ExtendedCardItemEditor";
