"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/steps/StepsCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une StepsCell avec ajout, suppression,
 * réordonnancement et édition des étapes.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Réutilise `StepListEditor`.
 * - Les items sont gérés par RHF via `useFieldArray` pour garantir
 *   une gestion propre des valeurs, erreurs et reorder.
 * - Les erreurs near-field sont gérées au niveau des items.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { StepListEditor } from "@compoz/studio/features/builder/editor/cells/steps/StepListEditor";
import { createEmptyStepItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { StepItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

const STEPS_VARIANTS = ["vertical"] as const;

type StepsVariant = (typeof STEPS_VARIANTS)[number];
type StepsFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type StepsItemsPath = `${StepsFieldBasePath}.items`;

type StepItemField = StepItemFormValues & { fieldId: string };

export type StepsCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
}>;

export function StepsCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
}: StepsCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as StepsFieldBasePath;

  const itemsPath = `${basePath}.items` as StepsItemsPath;

  const variantCtrl = useController({
    name: `${basePath}.variant` as `${StepsFieldBasePath}.variant`,
    control,
  });

  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    StepsItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const variant: StepsVariant =
    variantCtrl.field.value &&
    STEPS_VARIANTS.includes(variantCtrl.field.value as StepsVariant)
      ? (variantCtrl.field.value as StepsVariant)
      : "vertical";

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.stepsCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("studio.cellEditorTabs.stepsCellEditor.itemsHelp")}
        </p>
      </div>

      <div
        className={cn("grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3")}
      >
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.stepsCellEditor.variantLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {STEPS_VARIANTS.map((item) => (
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
                {t(`studio.cellEditorTabs.stepsCellEditor.variants.${item}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <StepListEditor
        control={control}
        idPrefix={idPrefix}
        basePath={basePath}
        fields={fields as StepItemField[]}
        append={append}
        remove={remove}
        move={move}
        disabled={disabled}
        createEmptyItem={createEmptyStepItem}
        minItems={1}
        showError={showError}
      />
    </div>
  );
}

StepsCellEditor.displayName = "StepsCellEditor";
