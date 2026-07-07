"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/testimonials/TestimonialItemEditor.tsx
 * @layer studio/features/builder/editor/cells/testimonials
 *
 * @description
 * RHF-aware editor for one TestimonialsCell item.
 *
 * @remarks
 * - Binds testimonial fields directly through RHF `useController`.
 * - Uses `sortableId` only for dnd-kit sorting.
 * - Shows quote and author name errors only after `showError` or the field has been touched.
 * - Uses `watchedItem` as a visual fallback to keep rendering stable during RHF rebinding after reordering.
 * - Stores the optional author image as a raw uploaded image URL.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { ImageSelector } from "@compoz/studio/components/molecules/fields/ImageSelector";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { MAX_IMAGE_UPLOAD_BYTES } from "@compoz/studio/lib/config/uploads";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type {
  TestimonialItemFormValues,
  TestimonialRatingFormValues,
} from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type TestimonialsFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type TestimonialItemBasePath = `${TestimonialsFieldBasePath}.items.${number}`;

function toTestimonialRatingValue(
  value: string,
): TestimonialRatingFormValues | undefined {
  if (value === "1") return 1;
  if (value === "2") return 2;
  if (value === "3") return 3;
  if (value === "4") return 4;
  if (value === "5") return 5;

  return undefined;
}

export type TestimonialItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: TestimonialsFieldBasePath;
  index: number;
  idPrefix: string;
  sortableId: string;
  watchedItem?: TestimonialItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function TestimonialItemEditor({
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
}: TestimonialItemEditorProps) {
  const t = useTranslations();
  const itemBasePath = `${basePath}.items.${index}` as TestimonialItemBasePath;

  const quoteCtrl = useController({
    name: `${itemBasePath}.quote` as `${TestimonialItemBasePath}.quote`,
    control,
    defaultValue: watchedItem?.quote ?? "",
  });
  const authorNameCtrl = useController({
    name: `${itemBasePath}.authorName` as `${TestimonialItemBasePath}.authorName`,
    control,
    defaultValue: watchedItem?.authorName ?? "",
  });
  const authorRoleCtrl = useController({
    name: `${itemBasePath}.authorRole` as `${TestimonialItemBasePath}.authorRole`,
    control,
    defaultValue: watchedItem?.authorRole,
  });
  const authorImageCtrl = useController({
    name: `${itemBasePath}.authorImage` as `${TestimonialItemBasePath}.authorImage`,
    control,
    defaultValue: watchedItem?.authorImage,
  });
  const ratingCtrl = useController({
    name: `${itemBasePath}.rating` as `${TestimonialItemBasePath}.rating`,
    control,
    defaultValue: watchedItem?.rating,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled });

  const quoteIds = createFieldIds(idPrefix, "quote");
  const authorNameIds = createFieldIds(idPrefix, "author-name");
  const authorRoleIds = createFieldIds(idPrefix, "author-role");
  const authorImageIds = createFieldIds(idPrefix, "author-image", {
    hint: true,
  });
  const ratingIds = createFieldIds(idPrefix, "rating");

  const showQuoteError = showError || quoteCtrl.fieldState.isTouched;
  const showAuthorNameError = showError || authorNameCtrl.fieldState.isTouched;
  const quoteError =
    showQuoteError && quoteCtrl.fieldState.error?.message
      ? String(quoteCtrl.fieldState.error.message)
      : undefined;
  const authorNameError =
    showAuthorNameError && authorNameCtrl.fieldState.error?.message
      ? String(authorNameCtrl.fieldState.error.message)
      : undefined;

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  const ratingItems = [
    {
      value: "none",
      label: t("studio.cellEditorTabs.testimonialsCellEditor.ratings.none"),
    },
    ...([1, 2, 3, 4, 5] as const).map((rating) => ({
      value: String(rating),
      label: t(
        `studio.cellEditorTabs.testimonialsCellEditor.ratings.${rating}`,
      ),
    })),
  ];

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

        <div className={cn("pt-1", STACK_MD)}>
          <TextareaField
            ids={quoteIds}
            label={t("studio.cellEditorTabs.testimonialsCellEditor.quoteLabel")}
            value={String(quoteCtrl.field.value ?? watchedItem?.quote ?? "")}
            onChange={quoteCtrl.field.onChange}
            onBlur={quoteCtrl.field.onBlur}
            disabled={disabled}
            placeholder={t(
              "studio.cellEditorTabs.testimonialsCellEditor.quotePlaceholder",
            )}
            help={t("studio.cellEditorTabs.testimonialsCellEditor.quoteHelp")}
            invalid={Boolean(quoteError)}
            error={quoteError}
            rows={4}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              ids={authorNameIds}
              inputRef={authorNameCtrl.field.ref}
              label={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorNameLabel",
              )}
              value={String(
                authorNameCtrl.field.value ?? watchedItem?.authorName ?? "",
              )}
              onChange={authorNameCtrl.field.onChange}
              onBlur={authorNameCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorNamePlaceholder",
              )}
              help={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorNameHelp",
              )}
              invalid={Boolean(authorNameError)}
              error={authorNameError}
            />

            <InputField
              ids={authorRoleIds}
              inputRef={authorRoleCtrl.field.ref}
              label={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorRoleLabel",
              )}
              value={String(
                authorRoleCtrl.field.value ?? watchedItem?.authorRole ?? "",
              )}
              onChange={authorRoleCtrl.field.onChange}
              onBlur={authorRoleCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorRolePlaceholder",
              )}
              help={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorRoleHelp",
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ImageSelector
              ids={authorImageIds}
              label={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorImageLabel",
              )}
              url={String(
                authorImageCtrl.field.value ?? watchedItem?.authorImage ?? "",
              )}
              onUrlChange={(value) => {
                authorImageCtrl.field.onChange(value || undefined);
              }}
              disabled={disabled}
              previewAlt=""
              help={t(
                "studio.cellEditorTabs.testimonialsCellEditor.authorImageHelp",
              )}
              accept="image/jpeg,image/png,image/webp,image/avif"
              onFileSelect={onUploadImage}
              onUploaded={(meta) => {
                authorImageCtrl.field.onChange(meta.url);
              }}
              maxBytes={MAX_IMAGE_UPLOAD_BYTES}
            />

            <SelectField
              ids={ratingIds}
              label={t(
                "studio.cellEditorTabs.testimonialsCellEditor.ratingLabel",
              )}
              value={
                ratingCtrl.field.value ? String(ratingCtrl.field.value) : "none"
              }
              onChange={(value) => {
                ratingCtrl.field.onChange(toTestimonialRatingValue(value));
              }}
              items={ratingItems}
              disabled={disabled}
              help={t(
                "studio.cellEditorTabs.testimonialsCellEditor.ratingHelp",
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

TestimonialItemEditor.displayName = "TestimonialItemEditor";
