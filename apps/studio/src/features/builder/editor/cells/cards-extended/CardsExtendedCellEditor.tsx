"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/cards-extended/CardsExtendedCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une CardsExtendedCell avec ajout, suppression,
 * réordonnancement et édition des cards étendues.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Réutilise `CardsExtendedListEditor`.
 * - Les items sont gérés par RHF via `useFieldArray` pour garantir
 *   une gestion propre des valeurs, erreurs et reorder.
 * - Les erreurs near-field sont gérées au niveau des items.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { CardExtendedListEditor } from "@compoz/studio/features/builder/editor/cells/cards-extended/CardExtendedListEditor";
import { createEmptyCardsExtendedItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CardsExtendedItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

const CARDS_EXTENDED_ALIGNS = ["left", "center"] as const;
const CARDS_EXTENDED_COLUMNS = [1, 2, 3] as const;

type CardsExtendedAlign = (typeof CARDS_EXTENDED_ALIGNS)[number];
type CardsExtendedColumns = (typeof CARDS_EXTENDED_COLUMNS)[number];
type CardsExtendedFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type CardsExtendedItemsPath = `${CardsExtendedFieldBasePath}.items`;

type CardsExtendedItemField = CardsExtendedItemFormValues & {
  fieldId: string;
};

export type CardsExtendedCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
}>;

export function CardsExtendedCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
}: CardsExtendedCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as CardsExtendedFieldBasePath;

  const itemsPath = `${basePath}.items` as CardsExtendedItemsPath;

  const alignCtrl = useController({
    name: `${basePath}.align` as `${CardsExtendedFieldBasePath}.align`,
    control,
  });

  const columnsCtrl = useController({
    name: `${basePath}.columns` as `${CardsExtendedFieldBasePath}.columns`,
    control,
  });

  /**
   * `useFieldArray` est la source de vérité RHF pour la liste des cards étendues.
   *
   * `keyName: "fieldId"` évite d’entrer en collision avec notre `id` métier
   * déjà présent dans `CardsExtendedItemFormValues`.
   */
  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    CardsExtendedItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const align: CardsExtendedAlign =
    alignCtrl.field.value &&
    CARDS_EXTENDED_ALIGNS.includes(alignCtrl.field.value as CardsExtendedAlign)
      ? (alignCtrl.field.value as CardsExtendedAlign)
      : "left";

  const columns: CardsExtendedColumns =
    columnsCtrl.field.value &&
    CARDS_EXTENDED_COLUMNS.includes(
      columnsCtrl.field.value as CardsExtendedColumns,
    )
      ? (columnsCtrl.field.value as CardsExtendedColumns)
      : 2;

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.cardsExtendedCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("studio.cellEditorTabs.cardsExtendedCellEditor.itemsHelp")}
        </p>
      </div>

      <div
        className={cn("grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3")}
      >
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.cardsExtendedCellEditor.alignLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {CARDS_EXTENDED_ALIGNS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={align === item ? "defaultStudio" : "ghostStudio"}
                onClick={() => {
                  alignCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(
                  `studio.cellEditorTabs.cardsExtendedCellEditor.aligns.${item}`,
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.cardsExtendedCellEditor.columnsLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {CARDS_EXTENDED_COLUMNS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={columns === item ? "defaultStudio" : "ghostStudio"}
                onClick={() => {
                  columnsCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(
                  `studio.cellEditorTabs.cardsExtendedCellEditor.columns.${item}`,
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
}

CardsExtendedCellEditor.displayName = "CardsExtendedCellEditor";
