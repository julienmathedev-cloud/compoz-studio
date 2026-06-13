"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/CardCollectionCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 * @description Éditeur RHF d’une collection homogène de cards.
 */

import type {
  CardCollectionAlign,
  CardCollectionCardKind,
  CardCollectionColumns,
} from "@compoz/core/domain/pages/entities/cell";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Control } from "react-hook-form";
import { useController, useFieldArray, useWatch } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { CardExtendedListEditor } from "@compoz/studio/features/builder/editor/cells/cards-extended/CardExtendedListEditor";
import { CardListEditor } from "@compoz/studio/features/builder/editor/cells/cards/CardListEditor";
import { StructuredCardListEditor } from "@compoz/studio/features/builder/editor/cells/structured-cards/StructuredCardListEditor";
import {
  createEmptyCardCollectionItem,
  createEmptyCardItem,
  createEmptyCardsExtendedItem,
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

const CARD_KINDS = ["card", "cardsExtended", "structuredCard"] as const;
const CARD_COLLECTION_ALIGNS = ["left", "center"] as const;

type CardCollectionFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type CardCollectionItemsPath = `${CardCollectionFieldBasePath}.items`;

type CardItemField = CardItemFormValues & { fieldId: string };
type CardsExtendedItemField = CardsExtendedItemFormValues & {
  fieldId: string;
};
type StructuredCardItemField = StructuredCardItemFormValues & {
  fieldId: string;
};

export type CardCollectionCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

function getEmptyItemByKind(kind: CardCollectionCardKind) {
  return createEmptyCardCollectionItem(kind);
}

function getColumnsByKind(
  kind: CardCollectionCardKind,
): ReadonlyArray<CardCollectionColumns> {
  return kind === "card" ? [2, 3, 4] : [1, 2, 3];
}

function getDefaultColumnsByKind(
  kind: CardCollectionCardKind,
): CardCollectionColumns {
  if (kind === "card") return 3;
  if (kind === "cardsExtended") return 2;
  return 1;
}

export function CardCollectionCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
  onUploadImage,
}: CardCollectionCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as CardCollectionFieldBasePath;

  const itemsPath = `${basePath}.items` as CardCollectionItemsPath;

  const cardKindCtrl = useController({
    name: `${basePath}.cardKind` as `${CardCollectionFieldBasePath}.cardKind`,
    control,
  });

  const columnsCtrl = useController({
    name: `${basePath}.columns` as `${CardCollectionFieldBasePath}.columns`,
    control,
  });

  const alignCtrl = useController({
    name: `${basePath}.align` as `${CardCollectionFieldBasePath}.align`,
    control,
  });

  const revealCtrl = useController({
    name: `${basePath}.reveal` as `${CardCollectionFieldBasePath}.reveal`,
    control,
  });

  const { fields, append, remove, replace, move } = useFieldArray<
    SectionBlockFormValues,
    CardCollectionItemsPath,
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
    | CardItemFormValues
    | CardsExtendedItemFormValues
    | StructuredCardItemFormValues
  >;

  const cardKind: CardCollectionCardKind =
    cardKindCtrl.field.value &&
    CARD_KINDS.includes(cardKindCtrl.field.value as CardCollectionCardKind)
      ? (cardKindCtrl.field.value as CardCollectionCardKind)
      : "card";

  const availableColumns = getColumnsByKind(cardKind);

  const columns: CardCollectionColumns = availableColumns.includes(
    columnsCtrl.field.value as CardCollectionColumns,
  )
    ? (columnsCtrl.field.value as CardCollectionColumns)
    : getDefaultColumnsByKind(cardKind);

  const align: CardCollectionAlign = CARD_COLLECTION_ALIGNS.includes(
    alignCtrl.field.value as CardCollectionAlign,
  )
    ? (alignCtrl.field.value as CardCollectionAlign)
    : "left";

  const revealIds = useMemo(
    () => createFieldIds(idPrefix, "reveal"),
    [idPrefix],
  );

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.cardCollectionCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-xs">
          {t("studio.cellEditorTabs.cardCollectionCellEditor.itemsHelp")}
        </p>
      </div>

      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.cardCollectionCellEditor.cardKindLabel")}
        </Text>

        <div className={cn(ROW_SM)}>
          {CARD_KINDS.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={cardKind === item ? "default" : "ghost"}
              visualMode="studio"
              onClick={() => {
                if (cardKind === item) return;

                cardKindCtrl.field.onChange(item);
                const nextColumns = getColumnsByKind(item);

                if (
                  !nextColumns.includes(
                    columnsCtrl.field.value as CardCollectionColumns,
                  )
                ) {
                  columnsCtrl.field.onChange(getDefaultColumnsByKind(item));
                }

                replace([getEmptyItemByKind(item)]);
              }}
              disabled={disabled}
            >
              {t(
                `studio.cellEditorTabs.cardCollectionCellEditor.cardKinds.${item}`,
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.cardCollectionCellEditor.columnsLabel")}
          </Text>

          <div className={cn(ROW_SM)}>
            {availableColumns.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={columns === item ? "default" : "ghost"}
                visualMode="studio"
                onClick={() => {
                  columnsCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(
                  `studio.cellEditorTabs.cardCollectionCellEditor.columns.${item}`,
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.cardCollectionCellEditor.alignLabel")}
          </Text>

          <div className={cn(ROW_SM)}>
            {CARD_COLLECTION_ALIGNS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={align === item ? "default" : "ghost"}
                visualMode="studio"
                onClick={() => {
                  alignCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(
                  `studio.cellEditorTabs.cardCollectionCellEditor.aligns.${item}`,
                )}
              </Button>
            ))}
          </div>
        </div>

        <SwitchField
          ids={revealIds}
          label={t(
            "studio.cellEditorTabs.cardCollectionCellEditor.revealLabel",
          )}
          help={t("studio.cellEditorTabs.cardCollectionCellEditor.revealHelp")}
          checked={Boolean(revealCtrl.field.value)}
          disabled={disabled}
          onCheckedChange={(checked) => {
            revealCtrl.field.onChange(checked);
          }}
        />
      </div>

      {cardKind === "card" ? (
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

      {cardKind === "cardsExtended" ? (
        <CardExtendedListEditor
          control={control}
          idPrefix={idPrefix}
          basePath={basePath}
          fields={fields as CardsExtendedItemField[]}
          watchedItems={watchedItems as CardsExtendedItemFormValues[]}
          append={append}
          remove={remove}
          move={move}
          disabled={disabled}
          createEmptyItem={createEmptyCardsExtendedItem}
          minItems={1}
          showError={showError}
        />
      ) : null}

      {cardKind === "structuredCard" ? (
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

CardCollectionCellEditor.displayName = "CardCollectionCellEditor";
