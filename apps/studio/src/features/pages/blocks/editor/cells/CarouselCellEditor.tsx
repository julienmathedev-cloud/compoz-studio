"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/cells/CarouselCellEditor.tsx
 * @layer ui/organisms
 *
 * @description
 * Éditeur UI d’une CarouselCell (liste d’images) avec ajout/suppression/réordonnancement.
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Modèle contrôlé : `images` + `onImagesChange`.
 * - Reorder simple via boutons (↑ ↓), pas de drag&drop.
 * - Réutilise `GalleryImageItemEditor` (actions + ImageFields).
 */

import { useMemo } from "react";

import { ImageListEditor } from "@compoz/studio/features/pages/blocks/editor/images/ImageListEditor";
import { createEmptyImageEditor } from "@compoz/studio/features/pages/mappers/cells-form";

import type { CarouselCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

export type CarouselCellEditorProps = Readonly<{
  idPrefix: string;
  value: CarouselCellFormValues;
  onChange: (next: CarouselCellFormValues) => void;
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  imageErrorsById?: Record<
    string,
    { src?: string; alt?: string; width?: string; height?: string }
  >;
}>;

export function CarouselCellEditor({
  idPrefix,
  value,
  onChange,
  disabled = false,
  onUploadImage,
  imageErrorsById,
}: CarouselCellEditorProps) {
  const images = useMemo(() => value.images ?? [], [value.images]);

  return (
    <ImageListEditor
      idPrefix={idPrefix}
      images={images}
      disabled={disabled}
      onUploadImage={onUploadImage}
      imageErrorsById={imageErrorsById}
      createEmptyItem={createEmptyImageEditor}
      onImagesChange={(nextImages) => {
        onChange({ kind: "carousel", images: Array.from(nextImages) });
      }}
    />
  );
}

CarouselCellEditor.displayName = "CarouselCellEditor";
