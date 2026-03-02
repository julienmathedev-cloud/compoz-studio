"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/cells/GalleryCellEditor.tsx
 * @layer ui/organisms
 *
 * @description
 * Éditeur UI d’une GalleryCell (liste d’images) avec ajout/suppression/réordonnancement.
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Modèle contrôlé (value/onChange) pour être branché facilement dans `CellEditorTabs`.
 * - V0.5 : reorder simple via boutons (↑ ↓), pas de drag&drop.
 * - Réutilise `ImageListEditor` (item = actions + ImageFields).
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
// ✅ adapte l'import selon ton projet (SelectField / SelectNativeField / etc.)
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";

import { ImageListEditor } from "@compoz/studio/features/pages/blocks/editor/images/ImageListEditor";
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { createEmptyImageEditor } from "@compoz/studio/features/pages/mappers/cells-form";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import type { GalleryCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

// ✅ si ton FormGrid est ailleurs, adapte l'import
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

export type GalleryCellEditorProps = Readonly<{
  idPrefix: string;
  value: GalleryCellFormValues;
  onChange: (next: GalleryCellFormValues) => void;
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  imageErrorsById?: Record<
    string,
    { src?: string; alt?: string; width?: string; height?: string }
  >;
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

/**
 * Convertit une string de SelectField ("1".."5") en union number (1..5).
 * Fallback safe = 3.
 */
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
  idPrefix,
  value,
  onChange,
  disabled = false,
  onUploadImage,
  imageErrorsById,
  internalPageOptions,
}: GalleryCellEditorProps) {
  const t = useTranslations();

  const images = useMemo(() => value.images ?? [], [value.images]);

  const linksEnabled = Boolean(value.linksEnabled);

  // ✅ IMPORTANT : ne jamais perdre maxColumns
  const maxColumns = clampMaxColumns(value.maxColumns);
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
      {/* ✅ Controls "settings" (switch + select) */}
      <FormGrid>
        <SelectField
          ids={maxColumnsIds}
          label={t("admin.galleryCellEditor.maxColumns.label")}
          help={t("admin.galleryCellEditor.maxColumns.help")}
          disabled={disabled}
          value={maxColumnsSelectValue}
          items={MAX_COLUMNS_ITEMS}
          onChange={(nextValue) => {
            const nextMax = toMaxColumnsFromSelectValue(nextValue);

            onChange({
              kind: "gallery",
              linksEnabled,
              maxColumns: nextMax,
              images: Array.from(images),
            });
          }}
        />

        <SwitchField
          ids={linksEnabledIds}
          label={t("admin.galleryCellEditor.linksEnabled.label")}
          help={t("admin.galleryCellEditor.linksEnabled.help")}
          checked={linksEnabled}
          disabled={disabled}
          onCheckedChange={(checked) => {
            // ✅ OFF => on force href=null pour éviter des href fantômes
            if (!checked) {
              const nextImages = images.map((img) => ({ ...img, href: null }));
              onChange({
                kind: "gallery",
                linksEnabled: false,
                maxColumns,
                images: nextImages,
              });
              return;
            }

            // ON => on ne fabrique pas d'href automatiquement
            onChange({
              kind: "gallery",
              linksEnabled: true,
              maxColumns,
              images: Array.from(images),
            });
          }}
        />
      </FormGrid>

      <ImageListEditor
        idPrefix={idPrefix}
        images={images}
        disabled={disabled}
        onUploadImage={onUploadImage}
        imageErrorsById={imageErrorsById}
        createEmptyItem={createEmptyImageEditor}
        linksEnabled={linksEnabled}
        internalPageOptions={internalPageOptions}
        onImagesChange={(nextImages) => {
          // ✅ sécurité : si linksEnabled=false, on normalise href=null même si un item revient avec href
          const normalized = linksEnabled
            ? Array.from(nextImages)
            : Array.from(nextImages).map((img) => ({ ...img, href: null }));

          onChange({
            kind: "gallery",
            linksEnabled,
            maxColumns,
            images: normalized,
          });
        }}
      />
    </div>
  );
}

GalleryCellEditor.displayName = "GalleryCellEditor";
