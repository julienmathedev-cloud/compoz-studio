"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/images/ImageListEditor.tsx
 * @layer ui/organisms
 *
 * @description
 * Éditeur UI générique : liste d’images (add/remove/reorder) pour Gallery/Carousel (V0.5).
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { moveItem, setAt } from "@compoz/ui/lib/array";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { ImageItemEditor } from "@compoz/studio/features/pages/blocks/editor/images/ImageItemEditor";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { ImageEditorFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

export type ImageListEditorProps = Readonly<{
  idPrefix: string;

  images: ReadonlyArray<ImageEditorFormValues>;
  onImagesChange: (next: ReadonlyArray<ImageEditorFormValues>) => void;

  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;

  /** Factory qui doit créer un item avec un ID unique. */
  createEmptyItem: () => ImageEditorFormValues;

  /** Erreurs par id (src/alt). */
  imageErrorsById?: Record<
    string,
    { src?: string; alt?: string; width?: string; height?: string }
  >;

  /** Invariant UI : au minimum 1 image */
  minItems?: number;

  /** ✅ Gallery-only : active l'édition des href par image */
  linksEnabled?: boolean;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
}>;

export function ImageListEditor({
  idPrefix,
  images,
  onImagesChange,
  disabled = false,
  onUploadImage,
  createEmptyItem,
  imageErrorsById,
  minItems = 1,
  linksEnabled = false,
  internalPageOptions,
}: ImageListEditorProps) {
  const t = useTranslations();

  const list = useMemo(() => images ?? [], [images]);

  const canRemove = list.length > minItems;

  const handleAdd = useCallback(() => {
    if (disabled) return;
    const next = Array.from(list);
    next.push(createEmptyItem());
    onImagesChange(next);
  }, [createEmptyItem, disabled, list, onImagesChange]);

  const handleRemove = useCallback(
    (index: number) => {
      if (disabled) return;
      if (!canRemove) return;

      const next = Array.from(list);
      next.splice(index, 1);
      onImagesChange(next);
    },
    [canRemove, disabled, list, onImagesChange],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (disabled) return;
      if (index <= 0) return;
      onImagesChange(moveItem(list, index, index - 1));
    },
    [disabled, list, onImagesChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (disabled) return;
      if (index >= list.length - 1) return;
      onImagesChange(moveItem(list, index, index + 1));
    },
    [disabled, list, onImagesChange],
  );

  return (
    <div className={cn(STACK_SM)}>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((img, i) => {
          const itemPrefix = `${idPrefix}-img-${img.id}`;

          const itemErrors = imageErrorsById?.[img.id];

          // ✅ fallback : si width/height cassent, on veut le VOIR sur le champ image
          const srcErrorMessage =
            itemErrors?.src ?? itemErrors?.width ?? itemErrors?.height;

          return (
            <li key={img.id} className="min-w-0">
              <ImageItemEditor
                idPrefix={itemPrefix}
                index={i}
                total={list.length}
                value={img}
                disabled={disabled}
                canRemove={canRemove}
                onUploadImage={onUploadImage}
                onChange={(nextImg) => {
                  onImagesChange(setAt(list, i, nextImg));
                }}
                onMoveUp={() => handleMoveUp(i)}
                onMoveDown={() => handleMoveDown(i)}
                onRemove={() => handleRemove(i)}
                srcInvalid={Boolean(srcErrorMessage)}
                srcErrorMessage={srcErrorMessage}
                linksEnabled={linksEnabled}
                internalPageOptions={internalPageOptions}
              />
            </li>
          );
        })}

        <li>
          <AddEmptyCardButton
            onClick={handleAdd}
            disabled={disabled}
            ariaLabel={t("common.add")}
            tooltip={t("common.add")}
            className="h-full"
            compact
          />
        </li>
      </ul>
    </div>
  );
}

ImageListEditor.displayName = "ImageListEditor";
