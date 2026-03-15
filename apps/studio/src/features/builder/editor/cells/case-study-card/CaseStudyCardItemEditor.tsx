"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/case-study-card/CaseStudyCardItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/case-study-card
 *
 * @description
 * Éditeur RHF-aware d’un item individuel de CaseStudyCardCell.
 *
 * @remarks
 * - Connecté directement à RHF via `useController`.
 * - Reprend le pattern card utilisé par les éditeurs de listes.
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - L’affichage des erreurs repose sur une règle unique :
 *   `showError || fieldState.isTouched`.
 * - Chaque item édite son propre contenu :
 *   image, title, context, solution, result.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { ImageFields } from "@compoz/studio/features/_shared/components/ImageFields";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CaseStudyCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type CaseStudyCardFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type CaseStudyCardItemBasePath =
  `${CaseStudyCardFieldBasePath}.items.${number}`;

export type CaseStudyCardItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: CaseStudyCardFieldBasePath;
  index: number;
  idPrefix: string;
  value: CaseStudyCardItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function CaseStudyCardItemEditor({
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
}: CaseStudyCardItemEditorProps) {
  const t = useTranslations();

  const itemBasePath =
    `${basePath}.items.${index}` as CaseStudyCardItemBasePath;

  const imageSrcCtrl = useController({
    name: `${itemBasePath}.image.src` as `${CaseStudyCardItemBasePath}.image.src`,
    control,
  });

  const imageAltCtrl = useController({
    name: `${itemBasePath}.image.alt` as `${CaseStudyCardItemBasePath}.image.alt`,
    control,
  });

  const imageCaptionCtrl = useController({
    name: `${itemBasePath}.image.caption` as `${CaseStudyCardItemBasePath}.image.caption`,
    control,
  });

  const imageWidthCtrl = useController({
    name: `${itemBasePath}.image.width` as `${CaseStudyCardItemBasePath}.image.width`,
    control,
  });

  const imageHeightCtrl = useController({
    name: `${itemBasePath}.image.height` as `${CaseStudyCardItemBasePath}.image.height`,
    control,
  });

  const titleCtrl = useController({
    name: `${itemBasePath}.title` as `${CaseStudyCardItemBasePath}.title`,
    control,
  });

  const contextCtrl = useController({
    name: `${itemBasePath}.context` as `${CaseStudyCardItemBasePath}.context`,
    control,
  });

  const solutionCtrl = useController({
    name: `${itemBasePath}.solution` as `${CaseStudyCardItemBasePath}.solution`,
    control,
  });

  const resultCtrl = useController({
    name: `${itemBasePath}.result` as `${CaseStudyCardItemBasePath}.result`,
    control,
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
  const contextIds = createFieldIds(idPrefix, "context");
  const solutionIds = createFieldIds(idPrefix, "solution");
  const resultIds = createFieldIds(idPrefix, "result");

  const shouldShowImageSrcError =
    showError || imageSrcCtrl.fieldState.isTouched;
  const shouldShowImageAltError =
    showError || imageAltCtrl.fieldState.isTouched;
  const shouldShowTitleError = showError || titleCtrl.fieldState.isTouched;
  const shouldShowContextError = showError || contextCtrl.fieldState.isTouched;
  const shouldShowSolutionError =
    showError || solutionCtrl.fieldState.isTouched;
  const shouldShowResultError = showError || resultCtrl.fieldState.isTouched;

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

  const contextInvalid =
    shouldShowContextError && Boolean(contextCtrl.fieldState.error?.message);

  const contextError =
    shouldShowContextError && contextCtrl.fieldState.error?.message
      ? String(contextCtrl.fieldState.error.message)
      : undefined;

  const solutionInvalid =
    shouldShowSolutionError && Boolean(solutionCtrl.fieldState.error?.message);

  const solutionError =
    shouldShowSolutionError && solutionCtrl.fieldState.error?.message
      ? String(solutionCtrl.fieldState.error.message)
      : undefined;

  const resultInvalid =
    shouldShowResultError && Boolean(resultCtrl.fieldState.error?.message);

  const resultError =
    shouldShowResultError && resultCtrl.fieldState.error?.message
      ? String(resultCtrl.fieldState.error.message)
      : undefined;

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
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
                  "studio.cellEditorTabs.caseStudyCardCellEditor.imageLabel",
                ),
                alt: t("studio.cellEditorTabs.image.altLabel"),
                caption: t("studio.cellEditorTabs.image.captionLabel"),
              }}
              help={{
                image: t(
                  "studio.cellEditorTabs.caseStudyCardCellEditor.imageHelp",
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
                "studio.cellEditorTabs.caseStudyCardCellEditor.titleLabel",
              )}
              value={String(titleCtrl.field.value ?? "")}
              onChange={titleCtrl.field.onChange}
              onBlur={titleCtrl.field.onBlur}
              placeholder={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.titlePlaceholder",
              )}
              disabled={disabled}
              help={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.titleHelp",
              )}
              invalid={titleInvalid}
              error={titleError}
            />

            <TextareaField
              ids={contextIds}
              label={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.contextLabel",
              )}
              value={String(contextCtrl.field.value ?? "")}
              onChange={contextCtrl.field.onChange}
              onBlur={contextCtrl.field.onBlur}
              placeholder={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.contextPlaceholder",
              )}
              disabled={disabled}
              rows={4}
              help={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.contextHelp",
              )}
              invalid={contextInvalid}
              error={contextError}
            />

            <TextareaField
              ids={solutionIds}
              label={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.solutionLabel",
              )}
              value={String(solutionCtrl.field.value ?? "")}
              onChange={solutionCtrl.field.onChange}
              onBlur={solutionCtrl.field.onBlur}
              placeholder={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.solutionPlaceholder",
              )}
              disabled={disabled}
              rows={4}
              help={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.solutionHelp",
              )}
              invalid={solutionInvalid}
              error={solutionError}
            />

            <TextareaField
              ids={resultIds}
              label={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.resultLabel",
              )}
              value={String(resultCtrl.field.value ?? "")}
              onChange={resultCtrl.field.onChange}
              onBlur={resultCtrl.field.onBlur}
              placeholder={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.resultPlaceholder",
              )}
              disabled={disabled}
              rows={4}
              help={t(
                "studio.cellEditorTabs.caseStudyCardCellEditor.resultHelp",
              )}
              invalid={resultInvalid}
              error={resultError}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

CaseStudyCardItemEditor.displayName = "CaseStudyCardItemEditor";
