"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/buttons/ButtonsCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une ButtonsCell avec ajout, suppression,
 * réordonnancement et édition des CTA.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Réutilise `ButtonListEditor`.
 * - Les items sont gérés par RHF via `useFieldArray` pour garantir
 *   une gestion propre des valeurs, erreurs et reorder.
 * - Les erreurs near-field sont gérées au niveau des items.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ButtonListEditor } from "@compoz/studio/features/builder/editor/cells/buttons/ButtonListEditor";
import { createEmptyButtonItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { ButtonItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

const BUTTON_ALIGNS = ["left", "center", "right"] as const;
const BUTTON_GAPS = ["sm", "md", "lg"] as const;

type ButtonsAlign = (typeof BUTTON_ALIGNS)[number];
type ButtonsGap = (typeof BUTTON_GAPS)[number];
type ButtonsFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type ButtonsItemsPath = `${ButtonsFieldBasePath}.items`;

type ButtonItemField = ButtonItemFormValues & { fieldId: string };

export type ButtonsCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
}>;

export function ButtonsCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
}: ButtonsCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as ButtonsFieldBasePath;

  const itemsPath = `${basePath}.items` as ButtonsItemsPath;

  const alignCtrl = useController({
    name: `${basePath}.align` as `${ButtonsFieldBasePath}.align`,
    control,
  });

  const gapCtrl = useController({
    name: `${basePath}.gap` as `${ButtonsFieldBasePath}.gap`,
    control,
  });

  /**
   * `useFieldArray` est la source de vérité RHF pour la liste des boutons.
   *
   * `keyName: "fieldId"` évite d’entrer en collision avec notre `id` métier
   * déjà présent dans `ButtonItemFormValues`.
   */
  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    ButtonsItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const align: ButtonsAlign =
    alignCtrl.field.value &&
    BUTTON_ALIGNS.includes(alignCtrl.field.value as ButtonsAlign)
      ? (alignCtrl.field.value as ButtonsAlign)
      : "left";

  const gap: ButtonsGap =
    gapCtrl.field.value &&
    BUTTON_GAPS.includes(gapCtrl.field.value as ButtonsGap)
      ? (gapCtrl.field.value as ButtonsGap)
      : "md";

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.buttonsCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("studio.cellEditorTabs.buttonsCellEditor.itemsHelp")}
        </p>
      </div>

      <div
        className={cn("grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3")}
      >
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.buttonsCellEditor.alignLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {BUTTON_ALIGNS.map((item) => (
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
                {t(`studio.cellEditorTabs.buttonsCellEditor.aligns.${item}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.buttonsCellEditor.gapLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {BUTTON_GAPS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={gap === item ? "defaultStudio" : "ghostStudio"}
                onClick={() => {
                  gapCtrl.field.onChange(item);
                }}
                disabled={disabled}
              >
                {t(`studio.cellEditorTabs.buttonsCellEditor.gaps.${item}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <ButtonListEditor
        control={control}
        idPrefix={idPrefix}
        basePath={basePath}
        fields={fields as ButtonItemField[]}
        append={append}
        remove={remove}
        move={move}
        disabled={disabled}
        createEmptyItem={createEmptyButtonItem}
        minItems={1}
        showError={showError}
      />
    </div>
  );
}

ButtonsCellEditor.displayName = "ButtonsCellEditor";
