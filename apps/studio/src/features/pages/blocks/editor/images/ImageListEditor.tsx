"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/images/ImageListEditor.tsx
 * @layer ui/studio/pages/blocks/editor/images
 *
 * @description
 * Éditeur UI générique : liste d’images (add/remove/reorder) pour Gallery/Carousel (V0.5).
 *
 * @remarks
 * - UI-only.
 * - Les mises à jour d’item sont appliquées par `id` stable.
 * - Utilise une ref sur la liste courante pour éviter les stale closures
 *   lors des uploads asynchrones.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { ImageItemEditor } from "@compoz/studio/features/pages/blocks/editor/images/ImageItemEditor";
import { moveItem } from "@compoz/ui/lib/array";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { ImageEditorFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type ImageItemErrors = Readonly<{
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
}>;

type ImagePatch = Partial<ImageEditorFormValues>;

export type ImageListEditorProps = Readonly<{
  idPrefix: string;

  images: ReadonlyArray<ImageEditorFormValues>;
  onImagesChange: (next: ReadonlyArray<ImageEditorFormValues>) => void;

  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;

  /** Factory qui doit créer un item avec un ID unique. */
  createEmptyItem: () => ImageEditorFormValues;

  /** Erreurs par id (src/alt). */
  imageErrorsById?: Record<string, ImageItemErrors>;

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
  const listRef = useRef<ReadonlyArray<ImageEditorFormValues>>(list);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const canRemove = list.length > minItems;

  /**
   * Retourne la liste la plus récente connue par le composant.
   * Évite d’utiliser un snapshot capturé dans une closure plus ancienne,
   * notamment quand un upload async se termine plus tard.
   */
  const getCurrentList =
    useCallback((): ReadonlyArray<ImageEditorFormValues> => {
      return listRef.current;
    }, []);

  /**
   * Applique un patch partiel sur un item identifié par son `id`,
   * en repartant toujours de la liste courante.
   */
  const patchImageById = useCallback(
    (imageId: string, patch: ImagePatch) => {
      const currentList = getCurrentList();
      const index = currentList.findIndex((item) => item.id === imageId);

      if (index < 0) return;

      const currentItem = currentList[index];
      const nextItem: ImageEditorFormValues = {
        ...currentItem,
        ...patch,
      };

      const nextList = Array.from(currentList);
      nextList[index] = nextItem;

      onImagesChange(nextList);
    },
    [getCurrentList, onImagesChange],
  );

  const handleAdd = useCallback(() => {
    if (disabled) return;

    const currentList = getCurrentList();
    const next = Array.from(currentList);

    next.push(createEmptyItem());

    onImagesChange(next);
  }, [createEmptyItem, disabled, getCurrentList, onImagesChange]);

  const handleRemoveById = useCallback(
    (imageId: string) => {
      if (disabled) return;

      const currentList = getCurrentList();
      if (currentList.length <= minItems) return;

      const next = currentList.filter((item) => item.id !== imageId);

      if (next.length === currentList.length) return;

      onImagesChange(next);
    },
    [disabled, getCurrentList, minItems, onImagesChange],
  );

  const handleMoveUpById = useCallback(
    (imageId: string) => {
      if (disabled) return;

      const currentList = getCurrentList();
      const index = currentList.findIndex((item) => item.id === imageId);

      if (index <= 0) return;

      onImagesChange(moveItem(currentList, index, index - 1));
    },
    [disabled, getCurrentList, onImagesChange],
  );

  const handleMoveDownById = useCallback(
    (imageId: string) => {
      if (disabled) return;

      const currentList = getCurrentList();
      const index = currentList.findIndex((item) => item.id === imageId);

      if (index < 0 || index >= currentList.length - 1) return;

      onImagesChange(moveItem(currentList, index, index + 1));
    },
    [disabled, getCurrentList, onImagesChange],
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
                onPatch={(patch) => {
                  patchImageById(img.id, patch);
                }}
                onMoveUp={() => handleMoveUpById(img.id)}
                onMoveDown={() => handleMoveDownById(img.id)}
                onRemove={() => handleRemoveById(img.id)}
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
