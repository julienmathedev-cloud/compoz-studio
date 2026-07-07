"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/images/ImageItemEditor.tsx
 * @layer studio/features/builder/editor/cells/images
 *
 * @description
 * RHF-aware editor for one image-list item.
 *
 * @remarks
 * - Binds image item fields directly through RHF `useController`.
 * - Uses `sortableId` only for dnd-kit sorting.
 * - Shows source and alt errors only after `showError` or the field has been touched.
 * - Uses `watchedItem` as a visual fallback to keep rendering stable during RHF rebinding after reordering.
 * - Clears image metadata when the source is emptied.
 * - Exposes href editing only when image links are enabled.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { ImageFields } from "@compoz/studio/features/_shared/components/ImageFields";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { ImageEditorFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

type ImageFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type ImageItemBasePath = `${ImageFieldBasePath}.items.${number}`;

export type ImageItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: ImageFieldBasePath;
  index: number;
  idPrefix: string;
  sortableId: string;
  watchedItem?: ImageEditorFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  linksEnabled?: boolean;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
}>;

export function ImageItemEditor({
  control,
  basePath,
  index,
  idPrefix,
  sortableId,
  watchedItem,
  disabled = false,
  canRemove = true,
  onRemove,
  showError = false,
  onUploadImage,
  linksEnabled = false,
  internalPageOptions,
}: ImageItemEditorProps) {
  const t = useTranslations();

  const itemBasePath = `${basePath}.items.${index}` as ImageItemBasePath;

  const srcCtrl = useController({
    name: `${itemBasePath}.src` as `${ImageItemBasePath}.src`,
    control,
    defaultValue: watchedItem?.src ?? "",
  });

  const altCtrl = useController({
    name: `${itemBasePath}.alt` as `${ImageItemBasePath}.alt`,
    control,
    defaultValue: watchedItem?.alt ?? "",
  });

  const captionCtrl = useController({
    name: `${itemBasePath}.caption` as `${ImageItemBasePath}.caption`,
    control,
    defaultValue: watchedItem?.caption ?? "",
  });

  const hrefCtrl = useController({
    name: `${itemBasePath}.href` as `${ImageItemBasePath}.href`,
    control,
    defaultValue: watchedItem?.href ?? null,
  });

  const widthCtrl = useController({
    name: `${itemBasePath}.width` as `${ImageItemBasePath}.width`,
    control,
    defaultValue: watchedItem?.width,
  });

  const heightCtrl = useController({
    name: `${itemBasePath}.height` as `${ImageItemBasePath}.height`,
    control,
    defaultValue: watchedItem?.height,
  });

  const mediaAssetIdCtrl = useController({
    name: `${itemBasePath}.mediaAssetId` as `${ImageItemBasePath}.mediaAssetId`,
    control,
    defaultValue: watchedItem?.mediaAssetId,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled,
  });

  const shouldShowSrcError = showError || srcCtrl.fieldState.isTouched;
  const shouldShowAltError = showError || altCtrl.fieldState.isTouched;

  const srcErrorMessage = shouldShowSrcError
    ? srcCtrl.fieldState.error?.message
      ? String(srcCtrl.fieldState.error.message)
      : widthCtrl.fieldState.error?.message
        ? String(widthCtrl.fieldState.error.message)
        : heightCtrl.fieldState.error?.message
          ? String(heightCtrl.fieldState.error.message)
          : undefined
    : undefined;

  const srcInvalid = Boolean(srcErrorMessage);

  const altInvalid =
    shouldShowAltError && Boolean(altCtrl.fieldState.error?.message);

  const altErrorMessage =
    shouldShowAltError && altCtrl.fieldState.error?.message
      ? String(altCtrl.fieldState.error.message)
      : undefined;

  const srcValue = String(srcCtrl.field.value ?? watchedItem?.src ?? "");
  const altValue = String(altCtrl.field.value ?? watchedItem?.alt ?? "");
  const captionValue = String(
    captionCtrl.field.value ?? watchedItem?.caption ?? "",
  );
  const hrefValue = hrefCtrl.field.value ?? watchedItem?.href ?? null;

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="default"
      visualMode="studio"
      className={cn("relative h-full", STACK_MD, isDragging && "opacity-60")}
    >
      <CardContent>
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
          <DragHandle
            className={cn(disabled && "pointer-events-none opacity-50")}
            disabled={disabled}
            {...attributes}
            {...listeners}
          />

          <DeleteButton
            disabled={!canRemove || disabled}
            onConfirmDelete={onRemove}
            ariaLabel={t("common.delete")}
            title={t("common.delete")}
          />
        </div>

        <div className="pt-1">
          <ImageFields
            idPrefix={idPrefix}
            disabled={disabled}
            onUploadImage={onUploadImage}
            onUploaded={(meta) => {
              srcCtrl.field.onChange(meta.url);
              widthCtrl.field.onChange(meta.width);
              heightCtrl.field.onChange(meta.height);
              mediaAssetIdCtrl.field.onChange(meta.mediaAssetId ?? undefined);
            }}
            accept="image/jpeg,image/png,image/webp,image/avif"
            preferredTypes={["image/webp", "image/avif"]}
            preferredTypeHint={t(
              "studio.imageSelector.hints.notRecommendedType",
              {
                types: "WEBP, AVIF",
              },
            )}
            labels={{
              image: t("studio.cellEditorTabs.image.srcLabel"),
              alt: t("studio.cellEditorTabs.image.altLabel"),
              caption: t("studio.cellEditorTabs.image.captionLabel"),
              href: t("studio.cellEditorTabs.image.hrefLabel"),
            }}
            help={{
              image: t("studio.cellEditorTabs.image.srcHelp"),
              alt: t("studio.cellEditorTabs.image.altPlaceholder"),
              caption: t("studio.cellEditorTabs.image.captionHelp"),
              href: t("studio.cellEditorTabs.image.hrefHelp"),
            }}
            srcField={{
              value: srcValue,
              onChange: (next) => {
                const nextSrc = String(next ?? "");
                const hasSrc = nextSrc.trim().length > 0;

                srcCtrl.field.onChange(nextSrc);
                widthCtrl.field.onChange(
                  hasSrc ? widthCtrl.field.value : undefined,
                );
                heightCtrl.field.onChange(
                  hasSrc ? heightCtrl.field.value : undefined,
                );
                mediaAssetIdCtrl.field.onChange(
                  hasSrc ? mediaAssetIdCtrl.field.value : undefined,
                );
              },
              onBlur: srcCtrl.field.onBlur,
            }}
            altField={{
              value: altValue,
              onChange: (next) => {
                altCtrl.field.onChange(String(next ?? ""));
              },
              onBlur: altCtrl.field.onBlur,
            }}
            captionField={{
              value: captionValue,
              onChange: (next) => {
                captionCtrl.field.onChange(String(next ?? ""));
              },
              onBlur: captionCtrl.field.onBlur,
            }}
            hrefField={
              linksEnabled
                ? {
                    value: hrefValue,
                    onChange: (next) => {
                      hrefCtrl.field.onChange(next);
                    },
                    onBlur: hrefCtrl.field.onBlur,
                  }
                : undefined
            }
            internalPageOptions={linksEnabled ? internalPageOptions : undefined}
            srcInvalid={srcInvalid}
            srcErrorMessage={srcErrorMessage}
            invalidAlt={altInvalid}
            altErrorMessage={altErrorMessage}
          />
        </div>
      </CardContent>
    </Card>
  );
}

ImageItemEditor.displayName = "ImageItemEditor";
