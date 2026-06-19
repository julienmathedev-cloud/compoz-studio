"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/cells/CarouselCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * RHF-aware editor for a CarouselCell with frame options and a dynamic
 * homogeneous item list.
 *
 * @remarks
 * - Connected directly to RHF through `useController`, `useFieldArray`, and `useWatch`.
 * - The carousel only owns:
 *   - `variant`
 *   - `showDots`
 *   - `showArrows`
 *   - `itemKind`
 *   - `items`
 * - Item content is edited through dedicated ListEditors.
 * - Item reordering relies on `move()` to preserve RHF state.
 * - `replace()` is only used for intentional collection replacements
 *   such as changing `itemKind`.
 */

import {
  normalizeCarouselItemKind,
  type CarouselCurrentItemKind,
  type CarouselItemKind as DomainCarouselItemKind,
} from "@compoz/core/domain/pages/entities/cell";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray, useWatch } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { CardListEditor } from "@compoz/studio/features/builder/editor/cells/card/CardListEditor";
import { ExtendedCardListEditor } from "@compoz/studio/features/builder/editor/cells/extended-card/ExtendedCardListEditor";
import { ImageListEditor } from "@compoz/studio/features/builder/editor/cells/images/ImageListEditor";
import { StructuredCardListEditor } from "@compoz/studio/features/builder/editor/cells/structured-card/StructuredCardListEditor";
import {
  createEmptyCardItem,
  createEmptyExtendedCardItem,
  createEmptyImageEditor,
  createEmptyStructuredCardItem,
} from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_SM, STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type {
  CardItemFormValues,
  ExtendedCardItemFormValues,
  ImageEditorFormValues,
  StructuredCardItemFormValues,
} from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

const CAROUSEL_VARIANTS = ["carousel", "slider"] as const;
const CAROUSEL_ITEM_KINDS = [
  "image",
  "card",
  "extendedCard",
  "structuredCard",
] as const;

type CarouselVariant = (typeof CAROUSEL_VARIANTS)[number];
type CarouselItemKind = CarouselCurrentItemKind;

type CarouselFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type CarouselItemsPath = `${CarouselFieldBasePath}.items`;

type ImageItemField = ImageEditorFormValues & { fieldId: string };
type CardItemField = CardItemFormValues & { fieldId: string };
type ExtendedCardItemField = ExtendedCardItemFormValues & {
  fieldId: string;
};
type StructuredCardItemField = StructuredCardItemFormValues & {
  fieldId: string;
};

export type CarouselCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

function getEmptyItemByKind(kind: CarouselItemKind) {
  if (kind === "image") return createEmptyImageEditor();
  if (kind === "card") return createEmptyCardItem();
  if (kind === "extendedCard") return createEmptyExtendedCardItem();
  return createEmptyStructuredCardItem();
}

function normalizeEditorItemKind(
  value: DomainCarouselItemKind | undefined,
): CarouselItemKind {
  if (!value) return "image";

  if (
    value === "cardsExtended" ||
    CAROUSEL_ITEM_KINDS.includes(value as CarouselItemKind)
  ) {
    return normalizeCarouselItemKind(value);
  }

  return "image";
}

export function CarouselCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
  onUploadImage,
}: CarouselCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as CarouselFieldBasePath;

  const itemsPath = `${basePath}.items` as CarouselItemsPath;

  const variantCtrl = useController({
    name: `${basePath}.variant` as `${CarouselFieldBasePath}.variant`,
    control,
  });

  const showDotsCtrl = useController({
    name: `${basePath}.showDots` as `${CarouselFieldBasePath}.showDots`,
    control,
  });

  const showArrowsCtrl = useController({
    name: `${basePath}.showArrows` as `${CarouselFieldBasePath}.showArrows`,
    control,
  });

  const itemKindCtrl = useController({
    name: `${basePath}.itemKind` as `${CarouselFieldBasePath}.itemKind`,
    control,
  });

  const { fields, append, remove, replace, move } = useFieldArray<
    SectionBlockFormValues,
    CarouselItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const watchedItems = (useWatch({
    control,
    name: itemsPath,
  }) ?? []) as Array<
    | ImageEditorFormValues
    | CardItemFormValues
    | ExtendedCardItemFormValues
    | StructuredCardItemFormValues
  >;

  const variant: CarouselVariant =
    variantCtrl.field.value &&
    CAROUSEL_VARIANTS.includes(variantCtrl.field.value as CarouselVariant)
      ? (variantCtrl.field.value as CarouselVariant)
      : "carousel";

  const rawItemKind = itemKindCtrl.field.value as
    | DomainCarouselItemKind
    | undefined;
  const itemKind = normalizeEditorItemKind(rawItemKind);

  const showDotsIds = createFieldIds(idPrefix, "showDots");
  const showArrowsIds = createFieldIds(idPrefix, "showArrows");

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.carouselCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-xs">
          {t("studio.cellEditorTabs.carouselCellEditor.itemsHelp")}
        </p>
      </div>

      <FormGrid>
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.carouselCellEditor.variantLabel")}
          </Text>

          <div className={cn(ROW_SM)}>
            {CAROUSEL_VARIANTS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={variant === item ? "default" : "ghost"}
                visualMode="studio"
                onClick={() => {
                  variantCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(`studio.cellEditorTabs.carouselCellEditor.variants.${item}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.carouselCellEditor.itemKindLabel")}
          </Text>

          <div className={cn(ROW_SM)}>
            {CAROUSEL_ITEM_KINDS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={itemKind === item ? "default" : "ghost"}
                visualMode="studio"
                onClick={() => {
                  itemKindCtrl.field.onChange(item);
                  replace([getEmptyItemByKind(item)]);
                }}
                disabled={disabled}
              >
                {t(
                  `studio.cellEditorTabs.carouselCellEditor.itemKinds.${item}`,
                )}
              </Button>
            ))}
          </div>
        </div>
      </FormGrid>

      <FormGrid>
        <SwitchField
          ids={showDotsIds}
          label={t("studio.cellEditorTabs.carouselCellEditor.showDotsLabel")}
          help={t("studio.cellEditorTabs.carouselCellEditor.showDotsHelp")}
          checked={Boolean(showDotsCtrl.field.value)}
          disabled={disabled}
          onCheckedChange={(checked) => {
            showDotsCtrl.field.onChange(checked);
          }}
        />

        <SwitchField
          ids={showArrowsIds}
          label={t("studio.cellEditorTabs.carouselCellEditor.showArrowsLabel")}
          help={t("studio.cellEditorTabs.carouselCellEditor.showArrowsHelp")}
          checked={Boolean(showArrowsCtrl.field.value)}
          disabled={disabled}
          onCheckedChange={(checked) => {
            showArrowsCtrl.field.onChange(checked);
          }}
        />
      </FormGrid>

      {itemKind === "image" ? (
        <ImageListEditor
          control={control}
          idPrefix={idPrefix}
          basePath={basePath}
          fields={fields as ImageItemField[]}
          watchedItems={watchedItems as ImageEditorFormValues[]}
          append={append}
          remove={remove}
          move={move}
          disabled={disabled}
          createEmptyItem={createEmptyImageEditor}
          minItems={1}
          showError={showError}
          onUploadImage={onUploadImage}
        />
      ) : null}

      {itemKind === "card" ? (
        <CardListEditor
          control={control}
          idPrefix={idPrefix}
          basePath={basePath}
          fields={fields as CardItemField[]}
          watchedItems={watchedItems as CardItemFormValues[]}
          append={append}
          remove={remove}
          move={move}
          disabled={disabled}
          createEmptyItem={createEmptyCardItem}
          minItems={1}
          showError={showError}
        />
      ) : null}

      {itemKind === "extendedCard" ? (
        <ExtendedCardListEditor
          control={control}
          idPrefix={idPrefix}
          basePath={basePath}
          fields={fields as ExtendedCardItemField[]}
          watchedItems={watchedItems as ExtendedCardItemFormValues[]}
          append={append}
          remove={remove}
          move={move}
          disabled={disabled}
          createEmptyItem={createEmptyExtendedCardItem}
          minItems={1}
          showError={showError}
        />
      ) : null}

      {itemKind === "structuredCard" ? (
        <StructuredCardListEditor
          control={control}
          idPrefix={idPrefix}
          basePath={basePath}
          fields={fields as StructuredCardItemField[]}
          watchedItems={watchedItems as StructuredCardItemFormValues[]}
          append={append}
          remove={remove}
          move={move}
          disabled={disabled}
          createEmptyItem={createEmptyStructuredCardItem}
          minItems={1}
          showError={showError}
          onUploadImage={onUploadImage}
        />
      ) : null}
    </div>
  );
}

CarouselCellEditor.displayName = "CarouselCellEditor";
