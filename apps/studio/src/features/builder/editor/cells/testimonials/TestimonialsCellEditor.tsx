"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/testimonials/TestimonialsCellEditor.tsx
 * @layer studio/features/builder/editor/cells/testimonials
 *
 * @description
 * RHF-aware TestimonialsCell editor for heading fields, display mode, and testimonial item editing.
 *
 * @remarks
 * - Binds title, description, and display mode directly through RHF `useController`.
 * - Manages testimonial items through `useFieldArray` so values, errors, and reordering stay consistent.
 * - Reads live item values through `useWatch` and delegates item rendering to `TestimonialsListEditor`.
 * - Passes optional image uploads down to testimonial item editors.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray, useWatch } from "react-hook-form";

import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { TestimonialsListEditor } from "@compoz/studio/features/builder/editor/cells/testimonials/TestimonialsListEditor";
import { createEmptyTestimonialItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { TestimonialItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type TestimonialsFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;
type TestimonialsItemsPath = `${TestimonialsFieldBasePath}.items`;
type TestimonialItemField = TestimonialItemFormValues & { fieldId: string };

export type TestimonialsCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function TestimonialsCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
  onUploadImage,
}: TestimonialsCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as TestimonialsFieldBasePath;
  const itemsPath = `${basePath}.items` as TestimonialsItemsPath;

  const titleCtrl = useController({
    name: `${basePath}.title` as `${TestimonialsFieldBasePath}.title`,
    control,
  });
  const descriptionCtrl = useController({
    name: `${basePath}.description` as `${TestimonialsFieldBasePath}.description`,
    control,
  });
  const displayModeCtrl = useController({
    name: `${basePath}.displayMode` as `${TestimonialsFieldBasePath}.displayMode`,
    control,
  });

  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    TestimonialsItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const watchedItems = (useWatch({
    control,
    name: itemsPath,
  }) ?? []) as TestimonialItemFormValues[];

  const titleIds = createFieldIds(idPrefix, "title");
  const descriptionIds = createFieldIds(idPrefix, "description");
  const displayModeIds = createFieldIds(idPrefix, "display-mode");

  return (
    <div className={cn(STACK_MD)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField
          ids={titleIds}
          inputRef={titleCtrl.field.ref}
          label={t("studio.cellEditorTabs.testimonialsCellEditor.titleLabel")}
          value={String(titleCtrl.field.value ?? "")}
          onChange={titleCtrl.field.onChange}
          onBlur={titleCtrl.field.onBlur}
          disabled={disabled}
          placeholder={t(
            "studio.cellEditorTabs.testimonialsCellEditor.titlePlaceholder",
          )}
          help={t("studio.cellEditorTabs.testimonialsCellEditor.titleHelp")}
        />

        <SelectField
          ids={displayModeIds}
          label={t(
            "studio.cellEditorTabs.testimonialsCellEditor.displayModeLabel",
          )}
          value={
            displayModeCtrl.field.value === "marquee" ? "marquee" : "static"
          }
          onChange={displayModeCtrl.field.onChange}
          disabled={disabled}
          help={t(
            "studio.cellEditorTabs.testimonialsCellEditor.displayModeHelp",
          )}
          items={[
            {
              value: "static",
              label: t(
                "studio.cellEditorTabs.testimonialsCellEditor.displayModes.static",
              ),
            },
            {
              value: "marquee",
              label: t(
                "studio.cellEditorTabs.testimonialsCellEditor.displayModes.marquee",
              ),
            },
          ]}
        />
      </div>

      <TextareaField
        ids={descriptionIds}
        label={t(
          "studio.cellEditorTabs.testimonialsCellEditor.descriptionLabel",
        )}
        value={String(descriptionCtrl.field.value ?? "")}
        onChange={descriptionCtrl.field.onChange}
        onBlur={descriptionCtrl.field.onBlur}
        disabled={disabled}
        placeholder={t(
          "studio.cellEditorTabs.testimonialsCellEditor.descriptionPlaceholder",
        )}
        help={t("studio.cellEditorTabs.testimonialsCellEditor.descriptionHelp")}
        rows={3}
      />

      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.testimonialsCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("studio.cellEditorTabs.testimonialsCellEditor.itemsHelp")}
        </p>
      </div>

      <TestimonialsListEditor
        control={control}
        idPrefix={idPrefix}
        basePath={basePath}
        fields={fields as TestimonialItemField[]}
        watchedItems={watchedItems}
        append={append}
        remove={remove}
        move={move}
        disabled={disabled}
        createEmptyItem={createEmptyTestimonialItem}
        minItems={1}
        showError={showError}
        onUploadImage={onUploadImage}
      />
    </div>
  );
}

TestimonialsCellEditor.displayName = "TestimonialsCellEditor";
