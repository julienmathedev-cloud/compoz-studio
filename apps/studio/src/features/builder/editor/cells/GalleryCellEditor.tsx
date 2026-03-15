"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/GalleryCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une GalleryCell avec ajout, suppression,
 * réordonnancement et édition des images.
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.
 * - Réutilise `ImageListEditor`.
 * - Les images sont gérées par RHF via `useFieldArray`.
 * - Les options de cellule (`maxColumns`, `linksEnabled`) restent portées
 *   au niveau de la cellule gallery.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { ImageListEditor } from "@compoz/studio/features/builder/editor/cells/images/ImageListEditor";
import { createEmptyImageEditor } from "@compoz/studio/features/pages/mappers/cells-form";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { ImageEditorFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

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

type GalleryFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type GalleryItemsPath = `${GalleryFieldBasePath}.items`;

type GalleryImageField = ImageEditorFormValues & {
  fieldId: string;
};

export type GalleryCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
}>;

const MAX_COLUMNS_ITEMS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
] as const;

function clampMaxColumns(v: unknown): GalleryMaxColumns {
  if (v === 1 || v === 2 || v === 3 || v === 4 || v === 5) return v;
  return 3;
}

function toMaxColumnsFromSelectValue(v: string): GalleryMaxColumns {
  switch (v) {
    case "1":
      return 1;
    case "2":
      return 2;
    case "3":
      return 3;
    case "4":
      return 4;
    case "5":
      return 5;
    default:
      return 3;
  }
}

function toSelectValueFromMaxColumns(v: GalleryMaxColumns): string {
  return String(v);
}

export function GalleryCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled = false,
  showError = false,
  onUploadImage,
  internalPageOptions,
}: GalleryCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as GalleryFieldBasePath;

  const itemsPath = `${basePath}.items` as GalleryItemsPath;

  const linksEnabledCtrl = useController({
    name: `${basePath}.linksEnabled` as `${GalleryFieldBasePath}.linksEnabled`,
    control,
  });

  const maxColumnsCtrl = useController({
    name: `${basePath}.maxColumns` as `${GalleryFieldBasePath}.maxColumns`,
    control,
  });

  const { fields, append, remove, move, replace } = useFieldArray<
    SectionBlockFormValues,
    GalleryItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const linksEnabled = Boolean(linksEnabledCtrl.field.value);
  const maxColumns = clampMaxColumns(maxColumnsCtrl.field.value);
  const maxColumnsSelectValue = toSelectValueFromMaxColumns(maxColumns);

  const linksEnabledIds = useMemo(
    () => createFieldIds(idPrefix, "linksEnabled"),
    [idPrefix],
  );

  const maxColumnsIds = useMemo(
    () => createFieldIds(idPrefix, "maxColumns"),
    [idPrefix],
  );

  return (
    <div className={cn(STACK_SM)}>
      <FormGrid>
        <SelectField
          ids={maxColumnsIds}
          label={t("studio.galleryCellEditor.maxColumns.label")}
          help={t("studio.galleryCellEditor.maxColumns.help")}
          disabled={disabled}
          value={maxColumnsSelectValue}
          items={MAX_COLUMNS_ITEMS}
          onChange={(nextValue) => {
            maxColumnsCtrl.field.onChange(
              toMaxColumnsFromSelectValue(nextValue),
            );
          }}
        />

        <SwitchField
          ids={linksEnabledIds}
          label={t("studio.galleryCellEditor.linksEnabled.label")}
          help={t("studio.galleryCellEditor.linksEnabled.help")}
          checked={linksEnabled}
          disabled={disabled}
          onCheckedChange={(checked) => {
            linksEnabledCtrl.field.onChange(checked);

            if (!checked) {
              const normalized = fields.map((img) => ({
                ...img,
                href: null,
              })) as ImageEditorFormValues[];

              replace(normalized);
            }
          }}
        />
      </FormGrid>

      <ImageListEditor
        control={control}
        idPrefix={idPrefix}
        basePath={basePath}
        fields={fields as GalleryImageField[]}
        append={append}
        remove={remove}
        move={move}
        disabled={disabled}
        createEmptyItem={createEmptyImageEditor}
        minItems={1}
        showError={showError}
        onUploadImage={onUploadImage}
        linksEnabled={linksEnabled}
        internalPageOptions={internalPageOptions}
      />
    </div>
  );
}

GalleryCellEditor.displayName = "GalleryCellEditor";
