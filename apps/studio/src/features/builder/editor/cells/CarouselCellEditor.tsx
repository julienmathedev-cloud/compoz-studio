"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/cells/CarouselCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une CarouselCell avec options de cadre
 * et rendu dynamique d’une liste homogène d’items.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Le carousel porte uniquement :
 *   - `variant`
 *   - `showDots`
 *   - `showArrows`
 *   - `itemKind`
 *   - `items`
 * - Les contenus sont édités via les ListEditors dédiés.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { CardExtendedListEditor } from "@compoz/studio/features/builder/editor/cells/cards-extended/CardExtendedListEditor";
import { CardListEditor } from "@compoz/studio/features/builder/editor/cells/cards/CardListEditor";
import { ImageListEditor } from "@compoz/studio/features/builder/editor/cells/images/ImageListEditor";
import { StructuredCardListEditor } from "@compoz/studio/features/builder/editor/cells/structured-cards/StructuredCardListEditor";
import {
  createEmptyCardItem,
  createEmptyCardsExtendedItem,
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
  CardsExtendedItemFormValues,
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
  "cardsExtended",
  "structuredCard",
] as const;

type CarouselVariant = (typeof CAROUSEL_VARIANTS)[number];
type CarouselItemKind = (typeof CAROUSEL_ITEM_KINDS)[number];

type CarouselFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type CarouselItemsPath = `${CarouselFieldBasePath}.items`;

type ImageItemField = ImageEditorFormValues & { fieldId: string };
type CardItemField = CardItemFormValues & { fieldId: string };
type CardsExtendedItemField = CardsExtendedItemFormValues & {
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
  if (kind === "cardsExtended") return createEmptyCardsExtendedItem();
  return createEmptyStructuredCardItem();
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

  const { fields, append, remove, move, replace } = useFieldArray<
    SectionBlockFormValues,
    CarouselItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const variant: CarouselVariant =
    variantCtrl.field.value &&
    CAROUSEL_VARIANTS.includes(variantCtrl.field.value as CarouselVariant)
      ? (variantCtrl.field.value as CarouselVariant)
      : "carousel";

  const itemKind: CarouselItemKind =
    itemKindCtrl.field.value &&
    CAROUSEL_ITEM_KINDS.includes(itemKindCtrl.field.value as CarouselItemKind)
      ? (itemKindCtrl.field.value as CarouselItemKind)
      : "image";

  const showDotsIds = createFieldIds(idPrefix, "showDots");
  const showArrowsIds = createFieldIds(idPrefix, "showArrows");

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.carouselCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
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
                variant={variant === item ? "defaultStudio" : "ghostStudio"}
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
                variant={itemKind === item ? "defaultStudio" : "ghostStudio"}
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
          append={append}
          remove={remove}
          move={move}
          disabled={disabled}
          createEmptyItem={createEmptyCardItem}
          minItems={1}
          showError={showError}
        />
      ) : null}

      {itemKind === "cardsExtended" ? (
        <CardExtendedListEditor
          control={control}
          idPrefix={idPrefix}
          basePath={basePath}
          fields={fields as CardsExtendedItemField[]}
          append={append}
          remove={remove}
          move={move}
          disabled={disabled}
          createEmptyItem={createEmptyCardsExtendedItem}
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
