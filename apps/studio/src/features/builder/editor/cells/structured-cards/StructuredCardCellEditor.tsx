"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/structured-cards/StructuredCardCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une StructuredCardCell avec ajout, suppression,
 * réordonnancement et édition d’une liste de structured cards.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Réutilise `StructuredCardListEditor`.
 * - Les items sont gérés par RHF via `useFieldArray` pour garantir
 *   une gestion propre des valeurs, erreurs et reorder.
 * - La cellule porte uniquement les options de layout (`columns`)
 *   et la liste des items (`items`).
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { StructuredCardListEditor } from "@compoz/studio/features/builder/editor/cells/structured-cards/StructuredCardListEditor";
import { createEmptyStructuredCardItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { StructuredCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

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

const STRUCTURED_CARD_COLUMNS = [1, 2, 3] as const;

type StructuredCardColumns = (typeof STRUCTURED_CARD_COLUMNS)[number];
type StructuredCardFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type StructuredCardItemsPath = `${StructuredCardFieldBasePath}.items`;

type StructuredCardItemField = StructuredCardItemFormValues & {
  fieldId: string;
};

export type StructuredCardCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function StructuredCardCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
  onUploadImage,
}: StructuredCardCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as StructuredCardFieldBasePath;

  const itemsPath = `${basePath}.items` as StructuredCardItemsPath;

  const columnsCtrl = useController({
    name: `${basePath}.columns` as `${StructuredCardFieldBasePath}.columns`,
    control,
  });

  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    StructuredCardItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const columns: StructuredCardColumns =
    columnsCtrl.field.value &&
    STRUCTURED_CARD_COLUMNS.includes(
      columnsCtrl.field.value as StructuredCardColumns,
    )
      ? (columnsCtrl.field.value as StructuredCardColumns)
      : 1;

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.structuredCardCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("studio.cellEditorTabs.structuredCardCellEditor.itemsHelp")}
        </p>
      </div>

      <div className={cn("grid grid-cols-1 gap-2 md:grid-cols-2")}>
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.structuredCardCellEditor.columnsLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {STRUCTURED_CARD_COLUMNS.map((item) => (
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
                  `studio.cellEditorTabs.structuredCardCellEditor.columns.${item}`,
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
}

StructuredCardCellEditor.displayName = "StructuredCardCellEditor";
