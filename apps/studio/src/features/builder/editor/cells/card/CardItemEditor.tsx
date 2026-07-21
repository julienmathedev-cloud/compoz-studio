"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/card/CardItemEditor.tsx
 * @layer studio/features/builder/editor/cells/card
 *
 * @description
 * RHF-aware editor for one CardCell item.
 *
 * @remarks
 * - Binds item fields directly through RHF `useController`.
 * - Uses `sortableId` only for dnd-kit sorting.
 * - Shows field errors only after `showError` or the field has been touched.
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
import { ButtonIconFields } from "@compoz/studio/components/molecules/fields/ButtonIconFields";
import { IconPicker } from "@compoz/studio/components/molecules/fields/IconPicker";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { LinkFieldsItem } from "@compoz/studio/components/molecules/fields/LinkFieldsItem";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import {
  getContentIconLabel,
  isContentIconKind,
  renderContentIcon,
} from "@compoz/ui/lib/icons/content-icons";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost"] as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonIconPosition = "before" | "after";
type ButtonIconValue = NonNullable<CardItemFormValues["button"]>["icon"];

type CardFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type CardItemBasePath = `${CardFieldBasePath}.items.${number}`;
type SectionBlockFieldPath = FieldPath<SectionBlockFormValues>;

export type CardItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: CardFieldBasePath;
  index: number;
  idPrefix: string;
  sortableId: string;
  watchedItem?: CardItemFormValues;
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

function isButtonVariant(value: string): value is ButtonVariant {
  return BUTTON_VARIANTS.includes(value as ButtonVariant);
}

function toButtonIconValue(value: unknown): ButtonIconValue {
  return typeof value === "string" && isContentIconKind(value) ? value : null;
}

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

  const eyebrowCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.eyebrow`),
    control,
    defaultValue: watchedItem?.eyebrow ?? "",
  });

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

  const buttonLabelCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.button.label`),
    control,
    defaultValue: watchedItem?.button?.label ?? "",
  });

  const buttonHrefCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.button.href`),
    control,
    defaultValue: watchedItem?.button?.href ?? "",
  });

  const buttonVariantCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.button.variant`),
    control,
    defaultValue: watchedItem?.button?.variant ?? "default",
  });

  const buttonIconCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.button.icon`),
    control,
    defaultValue: watchedItem?.button?.icon ?? null,
  });

  const buttonIconPositionCtrl = useController({
    name: toSectionBlockFieldPath(`${itemBasePath}.button.iconPosition`),
    control,
    defaultValue: watchedItem?.button?.iconPosition ?? "before",
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

  const eyebrowIds = createFieldIds(idPrefix, "eyebrow");
  const titleIds = createFieldIds(idPrefix, "title");
  const descriptionIds = createFieldIds(idPrefix, "description");
  const buttonLabelIds = createFieldIds(idPrefix, "button-label");
  const buttonVariantIds = createFieldIds(idPrefix, "button-variant");
  const buttonLinkIdPrefix = `${idPrefix}-button-link`;

  const shouldShowEyebrowError = showError || eyebrowCtrl.fieldState.isTouched;
  const shouldShowTitleError = showError || titleCtrl.fieldState.isTouched;
  const shouldShowDescriptionError =
    showError || descriptionCtrl.fieldState.isTouched;
  const shouldShowButtonLabelError =
    showError || buttonLabelCtrl.fieldState.isTouched;

  const eyebrowInvalid =
    shouldShowEyebrowError && Boolean(eyebrowCtrl.fieldState.error?.message);

  const eyebrowError =
    shouldShowEyebrowError && eyebrowCtrl.fieldState.error?.message
      ? String(eyebrowCtrl.fieldState.error.message)
      : undefined;

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

  const buttonLabelInvalid =
    shouldShowButtonLabelError &&
    Boolean(buttonLabelCtrl.fieldState.error?.message);

  const buttonLabelError =
    shouldShowButtonLabelError && buttonLabelCtrl.fieldState.error?.message
      ? String(buttonLabelCtrl.fieldState.error.message)
      : undefined;

  const eyebrowValue = String(
    eyebrowCtrl.field.value ?? watchedItem?.eyebrow ?? "",
  );

  const titleValue = String(titleCtrl.field.value ?? watchedItem?.title ?? "");

  const descriptionValue = String(
    descriptionCtrl.field.value ?? watchedItem?.description ?? "",
  );

  const buttonLabelValue = String(
    buttonLabelCtrl.field.value ?? watchedItem?.button?.label ?? "",
  );

  const buttonHrefValue = String(
    buttonHrefCtrl.field.value ?? watchedItem?.button?.href ?? "",
  );

  const currentButtonVariantRaw =
    toNullableString(buttonVariantCtrl.field.value) ??
    toNullableString(watchedItem?.button?.variant);

  const currentButtonVariant =
    currentButtonVariantRaw && isButtonVariant(currentButtonVariantRaw)
      ? currentButtonVariantRaw
      : "default";

  const buttonIconValue: ButtonIconValue =
    toButtonIconValue(buttonIconCtrl.field.value) ??
    toButtonIconValue(watchedItem?.button?.icon);

  const rawButtonIconPosition =
    toNullableString(buttonIconPositionCtrl.field.value) ??
    toNullableString(watchedItem?.button?.iconPosition);

  const buttonIconPositionValue: ButtonIconPosition =
    rawButtonIconPosition === "after" ? "after" : "before";

  const iconValue =
    toNullableString(iconCtrl.field.value) ??
    toNullableString(watchedItem?.icon);

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
              ids={eyebrowIds}
              inputRef={eyebrowCtrl.field.ref}
              label={t("studio.cellEditorTabs.cardCellEditor.eyebrowLabel")}
              value={eyebrowValue}
              onChange={eyebrowCtrl.field.onChange}
              onBlur={eyebrowCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.cardCellEditor.eyebrowPlaceholder",
              )}
              help={t("studio.cellEditorTabs.cardCellEditor.eyebrowHelp")}
              invalid={eyebrowInvalid}
              error={eyebrowError}
            />

            <InputField
              ids={titleIds}
              inputRef={titleCtrl.field.ref}
              label={t("studio.cellEditorTabs.cardCellEditor.titleLabel")}
              value={titleValue}
              onChange={titleCtrl.field.onChange}
              onBlur={titleCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.cardCellEditor.titlePlaceholder",
              )}
              help={t("studio.cellEditorTabs.cardCellEditor.titleHelp")}
              invalid={titleInvalid}
              error={titleError}
            />

            <TextareaField
              ids={descriptionIds}
              label={t("studio.cellEditorTabs.cardCellEditor.descriptionLabel")}
              value={descriptionValue}
              onChange={descriptionCtrl.field.onChange}
              onBlur={descriptionCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.cardCellEditor.descriptionPlaceholder",
              )}
              help={t("studio.cellEditorTabs.cardCellEditor.descriptionHelp")}
              invalid={descriptionInvalid}
              error={descriptionError}
              rows={4}
            />

            <div className={cn(STACK_MD)}>
              <Text as="p" className="font-medium">
                {t("studio.cellEditorTabs.cardCellEditor.iconLabel")}
              </Text>

              <button
                type="button"
                disabled={disabled}
                onClick={() => setIsIconPickerOpen((previous) => !previous)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left",
                  "transition-colors hover:bg-accent/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
                  disabled && "cursor-not-allowed opacity-60",
                )}
                aria-expanded={isIconPickerOpen}
                aria-label={t("studio.cellEditorTabs.cardCellEditor.iconLabel")}
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
                      {t("studio.cellEditorTabs.cardCellEditor.iconHelp")}
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
                  onChange={iconCtrl.field.onChange}
                  disabled={disabled}
                />
              ) : null}

              <Text as="p" variant="meta">
                {t("studio.cellEditorTabs.cardCellEditor.iconHelp")}
              </Text>
            </div>

            <div className={cn(STACK_MD)}>
              <Text as="p" className="text-sm font-semibold">
                {t("studio.cellEditorTabs.cardCellEditor.buttonLabel")}
              </Text>

              <InputField
                ids={buttonLabelIds}
                inputRef={buttonLabelCtrl.field.ref}
                label={t("studio.cellEditorTabs.buttonsCellEditor.labelLabel")}
                value={buttonLabelValue}
                onChange={buttonLabelCtrl.field.onChange}
                onBlur={buttonLabelCtrl.field.onBlur}
                disabled={disabled}
                placeholder={t(
                  "studio.cellEditorTabs.buttonsCellEditor.labelPlaceholder",
                )}
                help={t("studio.cellEditorTabs.buttonsCellEditor.labelHelp")}
                invalid={buttonLabelInvalid}
                error={buttonLabelError}
              />

              <LinkFieldsItem
                idPrefix={buttonLinkIdPrefix}
                href={buttonHrefValue}
                onHrefChange={buttonHrefCtrl.field.onChange}
                disabled={disabled}
              />

              <SelectField
                ids={buttonVariantIds}
                label={t(
                  "studio.cellEditorTabs.buttonsCellEditor.variantLabel",
                )}
                value={currentButtonVariant}
                onChange={(next) => {
                  if (isButtonVariant(next)) {
                    buttonVariantCtrl.field.onChange(next);
                  }
                }}
                items={BUTTON_VARIANTS.map((variant) => ({
                  value: variant,
                  label: t(
                    `studio.cellEditorTabs.buttonsCellEditor.variants.${variant}`,
                  ),
                }))}
                disabled={disabled}
                help={t("studio.cellEditorTabs.buttonsCellEditor.variantHelp")}
              />

              <ButtonIconFields
                idPrefix={`${idPrefix}-button-icon`}
                icon={buttonIconValue}
                iconPosition={buttonIconPositionValue}
                onIconChange={buttonIconCtrl.field.onChange}
                onIconPositionChange={buttonIconPositionCtrl.field.onChange}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

CardItemEditor.displayName = "CardItemEditor";
