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
 *   image, title, meta, bouton CTA et liste de sections.
 * - Le layout est pensé pour une édition plus lisible :
 *   image à gauche / textes image à droite, puis blocs 2 colonnes.
 * - La lecture/édition des valeurs passe par RHF (`useController`).
 * - `sortableId` sert uniquement au drag and drop.
 * - `watchedItem` sert de fallback visuel pour stabiliser le rendu
 *   pendant le rebinding RHF après reorder.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { ButtonIconFields } from "@compoz/studio/components/molecules/fields/ButtonIconFields";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { LinkFieldsItem } from "@compoz/studio/components/molecules/fields/LinkFieldsItem";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
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

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost"] as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonIconPosition = "before" | "after";

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
  sortableId: string;
  watchedItem?: StructuredCardItemFormValues;
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
  sortableId,
  watchedItem,
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
    defaultValue: watchedItem?.image?.src ?? "",
  });

  const imageAltCtrl = useController({
    name: `${itemBasePath}.image.alt` as `${StructuredCardItemBasePath}.image.alt`,
    control,
    defaultValue: watchedItem?.image?.alt ?? "",
  });

  const imageCaptionCtrl = useController({
    name: `${itemBasePath}.image.caption` as `${StructuredCardItemBasePath}.image.caption`,
    control,
    defaultValue: watchedItem?.image?.caption ?? "",
  });

  const imageWidthCtrl = useController({
    name: `${itemBasePath}.image.width` as `${StructuredCardItemBasePath}.image.width`,
    control,
    defaultValue: watchedItem?.image?.width,
  });

  const imageHeightCtrl = useController({
    name: `${itemBasePath}.image.height` as `${StructuredCardItemBasePath}.image.height`,
    control,
    defaultValue: watchedItem?.image?.height,
  });

  const titleCtrl = useController({
    name: `${itemBasePath}.title` as `${StructuredCardItemBasePath}.title`,
    control,
    defaultValue: watchedItem?.title ?? "",
  });

  const metaCtrl = useController({
    name: `${itemBasePath}.meta` as `${StructuredCardItemBasePath}.meta`,
    control,
    defaultValue: watchedItem?.meta ?? "",
  });

  const buttonLabelCtrl = useController({
    name: `${itemBasePath}.button.label` as `${StructuredCardItemBasePath}.button.label`,
    control,
    defaultValue: watchedItem?.button?.label ?? "",
  });

  const buttonHrefCtrl = useController({
    name: `${itemBasePath}.button.href` as `${StructuredCardItemBasePath}.button.href`,
    control,
    defaultValue: watchedItem?.button?.href ?? "",
  });

  const buttonVariantCtrl = useController({
    name: `${itemBasePath}.button.variant` as `${StructuredCardItemBasePath}.button.variant`,
    control,
    defaultValue: watchedItem?.button?.variant ?? "default",
  });

  const buttonIconCtrl = useController({
    name: `${itemBasePath}.button.icon` as `${StructuredCardItemBasePath}.button.icon`,
    control,
    defaultValue: watchedItem?.button?.icon ?? null,
  });

  const buttonIconPositionCtrl = useController({
    name: `${itemBasePath}.button.iconPosition` as `${StructuredCardItemBasePath}.button.iconPosition`,
    control,
    defaultValue: watchedItem?.button?.iconPosition ?? "before",
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
    id: sortableId,
    disabled,
  });

  const titleIds = createFieldIds(idPrefix, "title");
  const metaIds = createFieldIds(idPrefix, "meta");
  const buttonLabelIds = createFieldIds(idPrefix, "button-label");
  const buttonVariantIds = createFieldIds(idPrefix, "button-variant");
  const buttonLinkIdPrefix = `${idPrefix}-button-link`;

  const shouldShowImageSrcError =
    showError || imageSrcCtrl.fieldState.isTouched;
  const shouldShowImageAltError =
    showError || imageAltCtrl.fieldState.isTouched;
  const shouldShowTitleError = showError || titleCtrl.fieldState.isTouched;
  const shouldShowMetaError = showError || metaCtrl.fieldState.isTouched;
  const shouldShowButtonLabelError =
    showError || buttonLabelCtrl.fieldState.isTouched;

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

  const buttonLabelInvalid =
    shouldShowButtonLabelError &&
    Boolean(buttonLabelCtrl.fieldState.error?.message);

  const buttonLabelError =
    shouldShowButtonLabelError && buttonLabelCtrl.fieldState.error?.message
      ? String(buttonLabelCtrl.fieldState.error.message)
      : undefined;

  const currentButtonVariantRaw =
    buttonVariantCtrl.field.value ?? watchedItem?.button?.variant;

  const currentButtonVariant: ButtonVariant =
    currentButtonVariantRaw &&
    BUTTON_VARIANTS.includes(currentButtonVariantRaw as ButtonVariant)
      ? (currentButtonVariantRaw as ButtonVariant)
      : "default";

  const imageSrcValue = String(
    imageSrcCtrl.field.value ?? watchedItem?.image?.src ?? "",
  );
  const imageAltValue = String(
    imageAltCtrl.field.value ?? watchedItem?.image?.alt ?? "",
  );
  const imageCaptionValue = String(
    imageCaptionCtrl.field.value ?? watchedItem?.image?.caption ?? "",
  );
  const titleValue = String(titleCtrl.field.value ?? watchedItem?.title ?? "");
  const metaValue = String(metaCtrl.field.value ?? watchedItem?.meta ?? "");
  const buttonLabelValue = String(
    buttonLabelCtrl.field.value ?? watchedItem?.button?.label ?? "",
  );
  const buttonHrefValue = String(
    buttonHrefCtrl.field.value ?? watchedItem?.button?.href ?? "",
  );
  const buttonIconValue =
    buttonIconCtrl.field.value ?? watchedItem?.button?.icon ?? null;

  const rawButtonIconPosition =
    buttonIconPositionCtrl.field.value ?? watchedItem?.button?.iconPosition;

  const buttonIconPositionValue: ButtonIconPosition =
    rawButtonIconPosition === "after" ? "after" : "before";

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
          <div className={cn(STACK_MD)}>
            <div className="min-w-0">
              <ImageFields
                idPrefix={`${idPrefix}-image`}
                srcField={{
                  value: imageSrcValue,
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
                  value: imageAltValue,
                  onChange: (next) => {
                    imageAltCtrl.field.onChange(String(next ?? ""));
                  },
                  onBlur: imageAltCtrl.field.onBlur,
                }}
                captionField={{
                  value: imageCaptionValue,
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
                layout="split"
                srcInvalid={imageSrcInvalid}
                srcErrorMessage={imageSrcErrorMessage}
                invalidAlt={imageAltInvalid}
                altErrorMessage={imageAltErrorMessage}
              />
            </div>

            <FormGrid>
              <div className="min-w-0">
                <InputField
                  ids={titleIds}
                  inputRef={titleCtrl.field.ref}
                  label={t(
                    "studio.cellEditorTabs.structuredCardCellEditor.titleLabel",
                  )}
                  value={titleValue}
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
              </div>

              <div className="min-w-0">
                <InputField
                  ids={metaIds}
                  inputRef={metaCtrl.field.ref}
                  label={t(
                    "studio.cellEditorTabs.structuredCardCellEditor.metaLabel",
                  )}
                  value={metaValue}
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
              </div>
            </FormGrid>

            <Separator />

            <FormGrid>
              <Text as="p" className="text-sm font-semibold">
                {t(
                  "studio.cellEditorTabs.structuredCardCellEditor.buttonLabel",
                )}
              </Text>

              <div aria-hidden="true" />

              <div className={cn(STACK_MD)}>
                <InputField
                  ids={buttonLabelIds}
                  inputRef={buttonLabelCtrl.field.ref}
                  label={t(
                    "studio.cellEditorTabs.buttonsCellEditor.labelLabel",
                  )}
                  value={buttonLabelValue}
                  onChange={(next) => {
                    buttonLabelCtrl.field.onChange(next);
                  }}
                  onBlur={buttonLabelCtrl.field.onBlur}
                  disabled={disabled}
                  placeholder={t(
                    "studio.cellEditorTabs.buttonsCellEditor.labelPlaceholder",
                  )}
                  help={t("studio.cellEditorTabs.buttonsCellEditor.labelHelp")}
                  invalid={buttonLabelInvalid}
                  error={buttonLabelError}
                />

                <LinkFieldsItem
                  idPrefix={buttonLinkIdPrefix}
                  href={buttonHrefValue}
                  onHrefChange={(next) => {
                    buttonHrefCtrl.field.onChange(next);
                  }}
                  disabled={disabled}
                />

                <SelectField
                  ids={buttonVariantIds}
                  label={t(
                    "studio.cellEditorTabs.buttonsCellEditor.variantLabel",
                  )}
                  value={currentButtonVariant}
                  onChange={(next) => {
                    buttonVariantCtrl.field.onChange(next as ButtonVariant);
                  }}
                  items={BUTTON_VARIANTS.map((variant) => ({
                    value: variant,

                    label: t(
                      `studio.cellEditorTabs.buttonsCellEditor.variants.${variant}`,
                    ),
                  }))}
                  disabled={disabled}
                  help={t(
                    "studio.cellEditorTabs.buttonsCellEditor.variantHelp",
                  )}
                />
              </div>

              <ButtonIconFields
                idPrefix={`${idPrefix}-button-icon`}
                icon={buttonIconValue}
                iconPosition={buttonIconPositionValue}
                onIconChange={buttonIconCtrl.field.onChange}
                onIconPositionChange={buttonIconPositionCtrl.field.onChange}
                disabled={disabled}
              />
            </FormGrid>

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
