"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/cards/CardsCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une CardsCell avec ajout, suppression,
 * réordonnancement et édition des cards.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Réutilise `CardListEditor`.
 * - Les items sont gérés par RHF via `useFieldArray` pour garantir
 *   une gestion propre des valeurs, erreurs et reorder.
 * - Les erreurs near-field sont gérées au niveau des items.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { CardListEditor } from "@compoz/studio/features/builder/editor/cells/cards/CardListEditor";
import { createEmptyCardItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

const CARDS_ALIGNS = ["left", "center"] as const;
const CARDS_COLUMNS = [2, 3, 4] as const;

type CardsAlign = (typeof CARDS_ALIGNS)[number];
type CardsColumns = (typeof CARDS_COLUMNS)[number];
type CardsFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type CardsItemsPath = `${CardsFieldBasePath}.items`;

type CardItemField = CardItemFormValues & { fieldId: string };

export type CardsCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
}>;

export function CardsCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
}: CardsCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as CardsFieldBasePath;

  const itemsPath = `${basePath}.items` as CardsItemsPath;

  const alignCtrl = useController({
    name: `${basePath}.align` as `${CardsFieldBasePath}.align`,
    control,
  });

  const columnsCtrl = useController({
    name: `${basePath}.columns` as `${CardsFieldBasePath}.columns`,
    control,
  });

  /**
   * `useFieldArray` est la source de vérité RHF pour la liste des cards.
   *
   * `keyName: "fieldId"` évite d’entrer en collision avec notre `id` métier
   * déjà présent dans `CardItemFormValues`.
   */
  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    CardsItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const align: CardsAlign =
    alignCtrl.field.value &&
    CARDS_ALIGNS.includes(alignCtrl.field.value as CardsAlign)
      ? (alignCtrl.field.value as CardsAlign)
      : "left";

  const columns: CardsColumns =
    columnsCtrl.field.value &&
    CARDS_COLUMNS.includes(columnsCtrl.field.value as CardsColumns)
      ? (columnsCtrl.field.value as CardsColumns)
      : 3;

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.cardsCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("studio.cellEditorTabs.cardsCellEditor.itemsHelp")}
        </p>
      </div>

      <div
        className={cn("grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3")}
      >
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.cardsCellEditor.alignLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {CARDS_ALIGNS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={align === item ? "default" : "ghost"}
                onClick={() => {
                  alignCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(`studio.cellEditorTabs.cardsCellEditor.aligns.${item}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.cardsCellEditor.columnsLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {CARDS_COLUMNS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={columns === item ? "default" : "ghost"}
                onClick={() => {
                  columnsCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(`studio.cellEditorTabs.cardsCellEditor.columns.${item}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
}

CardsCellEditor.displayName = "CardsCellEditor";
