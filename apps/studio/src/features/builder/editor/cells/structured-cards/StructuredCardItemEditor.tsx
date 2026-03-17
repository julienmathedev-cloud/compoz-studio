"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/structured-cards/StructuredCardItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/structured-card
 *
 * @description
 * Éditeur RHF-aware d’un item individuel de StructuredCardCell.
 *
 * @remarks
 * - Connecté directement à RHF via `useController`.
 * - Reprend le pattern card utilisé par les éditeurs de listes.
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - L’affichage des erreurs repose sur une règle unique :
 *   `showError || fieldState.isTouched`.
 * - Chaque item édite son propre contenu :
 *   image, title, meta et liste de sections.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { ImageFields } from "@compoz/studio/features/_shared/components/ImageFields";
import { StructuredCardSectionEditor } from "@compoz/studio/features/builder/editor/cells/structured-cards/StructuredCardSectionEditor";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { createEmptyStructuredCardSection } from "@compoz/studio/features/pages/mappers/cells-form";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { StructuredCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type StructuredCardFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type StructuredCardItemBasePath =
  `${StructuredCardFieldBasePath}.items.${number}`;
type StructuredCardSectionsPath = `${StructuredCardItemBasePath}.sections`;

export type StructuredCardItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: StructuredCardFieldBasePath;
  index: number;
  idPrefix: string;
  value: StructuredCardItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function StructuredCardItemEditor({
  control,
  basePath,
  index,
  idPrefix,
  value,
  disabled = false,
  canRemove = true,
  onRemove,
  showError = false,
  onUploadImage,
}: StructuredCardItemEditorProps) {
  const t = useTranslations();

  const itemBasePath =
    `${basePath}.items.${index}` as StructuredCardItemBasePath;
  const sectionsPath = `${itemBasePath}.sections` as StructuredCardSectionsPath;

  const imageSrcCtrl = useController({
    name: `${itemBasePath}.image.src` as `${StructuredCardItemBasePath}.image.src`,
    control,
  });

  const imageAltCtrl = useController({
    name: `${itemBasePath}.image.alt` as `${StructuredCardItemBasePath}.image.alt`,
    control,
  });

  const imageCaptionCtrl = useController({
    name: `${itemBasePath}.image.caption` as `${StructuredCardItemBasePath}.image.caption`,
    control,
  });

  const imageWidthCtrl = useController({
    name: `${itemBasePath}.image.width` as `${StructuredCardItemBasePath}.image.width`,
    control,
  });

  const imageHeightCtrl = useController({
    name: `${itemBasePath}.image.height` as `${StructuredCardItemBasePath}.image.height`,
    control,
  });

  const titleCtrl = useController({
    name: `${itemBasePath}.title` as `${StructuredCardItemBasePath}.title`,
    control,
  });

  const metaCtrl = useController({
    name: `${itemBasePath}.meta` as `${StructuredCardItemBasePath}.meta`,
    control,
  });

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray<
    SectionBlockFormValues,
    StructuredCardSectionsPath,
    "fieldId"
  >({
    control,
    name: sectionsPath,
    keyName: "fieldId",
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value.id,
    disabled,
  });

  const titleIds = createFieldIds(idPrefix, "title");
  const metaIds = createFieldIds(idPrefix, "meta");

  const shouldShowImageSrcError =
    showError || imageSrcCtrl.fieldState.isTouched;
  const shouldShowImageAltError =
    showError || imageAltCtrl.fieldState.isTouched;
  const shouldShowTitleError = showError || titleCtrl.fieldState.isTouched;
  const shouldShowMetaError = showError || metaCtrl.fieldState.isTouched;

  const imageSrcErrorMessage = shouldShowImageSrcError
    ? imageSrcCtrl.fieldState.error?.message
      ? String(imageSrcCtrl.fieldState.error.message)
      : imageWidthCtrl.fieldState.error?.message
        ? String(imageWidthCtrl.fieldState.error.message)
        : imageHeightCtrl.fieldState.error?.message
          ? String(imageHeightCtrl.fieldState.error.message)
          : undefined
    : undefined;

  const imageSrcInvalid = Boolean(imageSrcErrorMessage);

  const imageAltInvalid =
    shouldShowImageAltError && Boolean(imageAltCtrl.fieldState.error?.message);

  const imageAltErrorMessage =
    shouldShowImageAltError && imageAltCtrl.fieldState.error?.message
      ? String(imageAltCtrl.fieldState.error.message)
      : undefined;

  const titleInvalid =
    shouldShowTitleError && Boolean(titleCtrl.fieldState.error?.message);

  const titleError =
    shouldShowTitleError && titleCtrl.fieldState.error?.message
      ? String(titleCtrl.fieldState.error.message)
      : undefined;

  const metaInvalid =
    shouldShowMetaError && Boolean(metaCtrl.fieldState.error?.message);

  const metaError =
    shouldShowMetaError && metaCtrl.fieldState.error?.message
      ? String(metaCtrl.fieldState.error.message)
      : undefined;

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="defaultStudio"
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
          <div className={cn(STACK_MD)}>
            <ImageFields
              idPrefix={`${idPrefix}-image`}
              srcField={{
                value: String(imageSrcCtrl.field.value ?? ""),
                onChange: (next) => {
                  const nextSrc = String(next ?? "");

                  if (!nextSrc.trim()) {
                    imageSrcCtrl.field.onChange("");
                    imageAltCtrl.field.onChange("");
                    imageCaptionCtrl.field.onChange("");
                    imageWidthCtrl.field.onChange(undefined);
                    imageHeightCtrl.field.onChange(undefined);
                    return;
                  }

                  imageSrcCtrl.field.onChange(nextSrc);
                },
                onBlur: imageSrcCtrl.field.onBlur,
              }}
              altField={{
                value: String(imageAltCtrl.field.value ?? ""),
                onChange: (next) => {
                  imageAltCtrl.field.onChange(String(next ?? ""));
                },
                onBlur: imageAltCtrl.field.onBlur,
              }}
              captionField={{
                value: String(imageCaptionCtrl.field.value ?? ""),
                onChange: (next) => {
                  imageCaptionCtrl.field.onChange(String(next ?? ""));
                },
                onBlur: imageCaptionCtrl.field.onBlur,
              }}
              disabled={disabled}
              onUploadImage={onUploadImage}
              onUploaded={(meta) => {
                imageSrcCtrl.field.onChange(meta.url);
                imageWidthCtrl.field.onChange(meta.width);
                imageHeightCtrl.field.onChange(meta.height);
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
                image: t(
                  "studio.cellEditorTabs.structuredCardCellEditor.imageLabel",
                ),
                alt: t("studio.cellEditorTabs.image.altLabel"),
                caption: t("studio.cellEditorTabs.image.captionLabel"),
              }}
              help={{
                image: t(
                  "studio.cellEditorTabs.structuredCardCellEditor.imageHelp",
                ),
                alt: t("studio.cellEditorTabs.image.altHelp"),
                caption: t("studio.cellEditorTabs.image.captionHelp"),
              }}
              layout="stack"
              srcInvalid={imageSrcInvalid}
              srcErrorMessage={imageSrcErrorMessage}
              invalidAlt={imageAltInvalid}
              altErrorMessage={imageAltErrorMessage}
            />

            <InputField
              ids={titleIds}
              inputRef={titleCtrl.field.ref}
              label={t(
                "studio.cellEditorTabs.structuredCardCellEditor.titleLabel",
              )}
              value={String(titleCtrl.field.value ?? "")}
              onChange={titleCtrl.field.onChange}
              onBlur={titleCtrl.field.onBlur}
              placeholder={t(
                "studio.cellEditorTabs.structuredCardCellEditor.titlePlaceholder",
              )}
              disabled={disabled}
              help={t(
                "studio.cellEditorTabs.structuredCardCellEditor.titleHelp",
              )}
              invalid={titleInvalid}
              error={titleError}
            />

            <InputField
              ids={metaIds}
              inputRef={metaCtrl.field.ref}
              label={t(
                "studio.cellEditorTabs.structuredCardCellEditor.metaLabel",
              )}
              value={String(metaCtrl.field.value ?? "")}
              onChange={metaCtrl.field.onChange}
              onBlur={metaCtrl.field.onBlur}
              placeholder={t(
                "studio.cellEditorTabs.structuredCardCellEditor.metaPlaceholder",
              )}
              disabled={disabled}
              help={t(
                "studio.cellEditorTabs.structuredCardCellEditor.metaHelp",
              )}
              invalid={metaInvalid}
              error={metaError}
            />

            <Separator />

            <div className={cn(STACK_SM)}>
              {sectionFields.map((section, sectionIndex) => (
                <StructuredCardSectionEditor
                  key={section.fieldId}
                  control={control}
                  itemBasePath={itemBasePath}
                  sectionIndex={sectionIndex}
                  sectionId={section.id}
                  idPrefix={idPrefix}
                  disabled={disabled}
                  showError={showError}
                  canRemove={sectionFields.length > 1}
                  onRemove={() => removeSection(sectionIndex)}
                />
              ))}

              <AddEmptyCardButton
                onClick={() =>
                  appendSection(createEmptyStructuredCardSection())
                }
                disabled={disabled}
                ariaLabel={t(
                  "studio.cellEditorTabs.structuredCardCellEditor.addSection",
                )}
                tooltip={t(
                  "studio.cellEditorTabs.structuredCardCellEditor.addSection",
                )}
                compact
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

StructuredCardItemEditor.displayName = "StructuredCardItemEditor";
