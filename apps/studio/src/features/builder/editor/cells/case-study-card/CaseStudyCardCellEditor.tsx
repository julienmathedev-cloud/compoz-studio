"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/case-study-card/CaseStudyCardCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une CaseStudyCardCell avec ajout, suppression,
 * réordonnancement et édition d’une liste de case studies.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Réutilise `CaseStudyCardListEditor`.
 * - Les items sont gérés par RHF via `useFieldArray` pour garantir
 *   une gestion propre des valeurs, erreurs et reorder.
 * - La cellule porte uniquement les options de layout (`columns`)
 *   et la liste des items (`items`).
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { CaseStudyCardListEditor } from "@compoz/studio/features/builder/editor/cells/case-study-card/CaseStudyCardListEditor";
import { createEmptyCaseStudyCardItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CaseStudyCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

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

const CASE_STUDY_CARD_COLUMNS = [1, 2, 3] as const;

type CaseStudyCardColumns = (typeof CASE_STUDY_CARD_COLUMNS)[number];
type CaseStudyCardFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type CaseStudyCardItemsPath = `${CaseStudyCardFieldBasePath}.items`;

type CaseStudyCardItemField = CaseStudyCardItemFormValues & {
  fieldId: string;
};

export type CaseStudyCardCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function CaseStudyCardCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
  onUploadImage,
}: CaseStudyCardCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as CaseStudyCardFieldBasePath;

  const itemsPath = `${basePath}.items` as CaseStudyCardItemsPath;

  const columnsCtrl = useController({
    name: `${basePath}.columns` as `${CaseStudyCardFieldBasePath}.columns`,
    control,
  });

  /**
   * `useFieldArray` est la source de vérité RHF pour la liste des case studies.
   *
   * `keyName: "fieldId"` évite d’entrer en collision avec notre `id` métier
   * déjà présent dans `CaseStudyCardItemFormValues`.
   */
  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    CaseStudyCardItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const columns: CaseStudyCardColumns =
    columnsCtrl.field.value &&
    CASE_STUDY_CARD_COLUMNS.includes(
      columnsCtrl.field.value as CaseStudyCardColumns,
    )
      ? (columnsCtrl.field.value as CaseStudyCardColumns)
      : 1;

  return (
    <div className={cn(STACK_MD)}>
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.caseStudyCardCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("studio.cellEditorTabs.caseStudyCardCellEditor.itemsHelp")}
        </p>
      </div>

      <div className={cn("grid grid-cols-1 gap-2 md:grid-cols-2")}>
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.caseStudyCardCellEditor.columnsLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {CASE_STUDY_CARD_COLUMNS.map((item) => (
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
                {t(
                  `studio.cellEditorTabs.caseStudyCardCellEditor.columns.${item}`,
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <CaseStudyCardListEditor
        control={control}
        idPrefix={idPrefix}
        basePath={basePath}
        fields={fields as CaseStudyCardItemField[]}
        append={append}
        remove={remove}
        move={move}
        disabled={disabled}
        createEmptyItem={createEmptyCaseStudyCardItem}
        minItems={1}
        showError={showError}
        onUploadImage={onUploadImage}
      />
    </div>
  );
}

CaseStudyCardCellEditor.displayName = "CaseStudyCardCellEditor";
