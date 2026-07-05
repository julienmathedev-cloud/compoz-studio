"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/images/ImageCellEditor.tsx
 * @description
 * Éditeur RHF-aware d’une ImageCell avec gestion de la source,
 * de l’alt, de la caption, de la variante d’affichage et de la taille visuelle.
 *
 * @remarks
 * - Connecté directement à RHF via `useController`.
 * - S’aligne sur le standard builder :
 *   `showError || fieldState.isTouched`.
 * - Conserve strictement le comportement métier initial :
 *   pas de champ href affiché pour une image simple.
 * - Réutilise `ImageFields` pour l’édition UI.
 * - Réinitialise proprement les métadonnées image quand la source est vidée.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { ImageFields } from "@compoz/studio/features/_shared/components/ImageFields";
import { Button } from "@compoz/ui/components/ui/button";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_SM, STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

const VARIANTS = ["default", "wide", "portrait", "square"] as const;
const SIZES = ["sm", "md", "lg", "full"] as const;

type Variant = (typeof VARIANTS)[number];
type Size = (typeof SIZES)[number];
type ImageFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;

export type ImageCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function ImageCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
  onUploadImage,
}: ImageCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as ImageFieldBasePath;

  const srcCtrl = useController({
    name: `${basePath}.image.src` as `${ImageFieldBasePath}.image.src`,
    control,
  });

  const altCtrl = useController({
    name: `${basePath}.image.alt` as `${ImageFieldBasePath}.image.alt`,
    control,
  });

  const captionCtrl = useController({
    name: `${basePath}.image.caption` as `${ImageFieldBasePath}.image.caption`,
    control,
  });

  const widthCtrl = useController({
    name: `${basePath}.image.width` as `${ImageFieldBasePath}.image.width`,
    control,
  });

  const heightCtrl = useController({
    name: `${basePath}.image.height` as `${ImageFieldBasePath}.image.height`,
    control,
  });

  const mediaAssetIdCtrl = useController({
    name: `${basePath}.image.mediaAssetId` as `${ImageFieldBasePath}.image.mediaAssetId`,
    control,
  });

  const variantCtrl = useController({
    name: `${basePath}.variant` as `${ImageFieldBasePath}.variant`,
    control,
  });

  const sizeCtrl = useController({
    name: `${basePath}.size` as `${ImageFieldBasePath}.size`,
    control,
  });

  const revealCtrl = useController({
    name: `${basePath}.reveal` as `${ImageFieldBasePath}.reveal`,
    control,
  });

  const zoomEnabledCtrl = useController({
    name: `${basePath}.zoomEnabled` as `${ImageFieldBasePath}.zoomEnabled`,
    control,
  });

  const revealIds = createFieldIds(idPrefix, "reveal");
  const zoomEnabledIds = createFieldIds(idPrefix, "zoom-enabled");

  const variant: Variant =
    variantCtrl.field.value &&
    VARIANTS.includes(variantCtrl.field.value as Variant)
      ? (variantCtrl.field.value as Variant)
      : "default";

  const size: Size =
    sizeCtrl.field.value && SIZES.includes(sizeCtrl.field.value as Size)
      ? (sizeCtrl.field.value as Size)
      : "full";

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

  const variantSlot = (
    <>
      <SwitchField
        ids={revealIds}
        label={t("studio.cellEditorTabs.imageCellEditor.revealLabel")}
        checked={
          typeof revealCtrl.field.value === "boolean"
            ? revealCtrl.field.value
            : false
        }
        onCheckedChange={revealCtrl.field.onChange}
        disabled={disabled}
        help={t("studio.cellEditorTabs.imageCellEditor.revealHelp")}
      />

      <SwitchField
        ids={zoomEnabledIds}
        label={t("studio.cellEditorTabs.imageCellEditor.zoomLabel")}
        checked={
          typeof zoomEnabledCtrl.field.value === "boolean"
            ? zoomEnabledCtrl.field.value
            : false
        }
        onCheckedChange={zoomEnabledCtrl.field.onChange}
        disabled={disabled}
        help={t("studio.cellEditorTabs.imageCellEditor.zoomHelp")}
      />

      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.imageCellEditor.variantLabel")}
        </Text>

        <div className={cn(ROW_SM)}>
          {VARIANTS.map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={variant === v ? "default" : "ghost"}
              visualMode="studio"
              disabled={disabled}
              onClick={() => {
                variantCtrl.field.onChange(v);
              }}
            >
              {t(`studio.cellEditorTabs.imageCellEditor.variants.${v}`)}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.imageCellEditor.sizeLabel")}
        </Text>

        <div className={cn(ROW_SM)}>
          {SIZES.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={size === s ? "default" : "ghost"}
              visualMode="studio"
              disabled={disabled}
              onClick={() => {
                sizeCtrl.field.onChange(s);
              }}
            >
              {t(`studio.cellEditorTabs.imageCellEditor.sizes.${s}`)}
            </Button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className={cn(STACK_MD)}>
      <ImageFields
        idPrefix={idPrefix}
        srcField={{
          value: String(srcCtrl.field.value ?? ""),
          onChange: (next) => {
            const nextSrc = String(next ?? "");

            if (!nextSrc.trim()) {
              srcCtrl.field.onChange("");
              altCtrl.field.onChange("");
              captionCtrl.field.onChange("");
              widthCtrl.field.onChange(undefined);
              heightCtrl.field.onChange(undefined);
              mediaAssetIdCtrl.field.onChange(undefined);
              return;
            }

            srcCtrl.field.onChange(nextSrc);
          },
          onBlur: srcCtrl.field.onBlur,
        }}
        altField={{
          value: String(altCtrl.field.value ?? ""),
          onChange: (next) => {
            altCtrl.field.onChange(String(next ?? ""));
          },
          onBlur: altCtrl.field.onBlur,
        }}
        captionField={{
          value: String(captionCtrl.field.value ?? ""),
          onChange: (next) => {
            captionCtrl.field.onChange(String(next ?? ""));
          },
          onBlur: captionCtrl.field.onBlur,
        }}
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
        preferredTypeHint={t("studio.imageSelector.hints.notRecommendedType", {
          types: "WEBP, AVIF",
        })}
        labels={{
          image: t("studio.cellEditorTabs.image.srcLabel"),
          alt: t("studio.cellEditorTabs.image.altLabel"),
          caption: t("studio.cellEditorTabs.image.captionLabel"),
        }}
        help={{
          image: t("studio.cellEditorTabs.image.srcHelp"),
          alt: t("studio.cellEditorTabs.image.altHelp"),
          caption: t("studio.cellEditorTabs.image.captionHelp"),
        }}
        layout="split"
        sideSlot={variantSlot}
        srcInvalid={srcInvalid}
        srcErrorMessage={srcErrorMessage}
        invalidAlt={altInvalid}
        altErrorMessage={altErrorMessage}
      />
    </div>
  );
}

ImageCellEditor.displayName = "ImageCellEditor";
