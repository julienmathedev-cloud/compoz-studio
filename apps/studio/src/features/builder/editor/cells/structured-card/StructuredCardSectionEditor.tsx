"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/structured-card/StructuredCardSectionEditor.tsx
 * @layer studio/features/builder/editor/cells/structured-card
 *
 * @description
 * RHF-aware editor for one nested StructuredCardCell section item.
 *
 * @remarks
 * - Binds section label and content directly through RHF `useController`.
 * - Shows label and content errors only after `showError` or the field has been touched.
 * - Keeps section removal controlled by the parent list through `onRemove` and `canRemove`.
 */

import { useTranslations } from "next-intl";
import type { Control, FieldPath } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type StructuredCardItemBasePath =
  `rows.${number}.columns.${number}.cells.${number}.items.${number}`;
type StructuredCardSectionBasePath =
  `${StructuredCardItemBasePath}.sections.${number}`;

type SectionBlockFieldPath = FieldPath<SectionBlockFormValues>;

type StructuredCardSectionEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  itemBasePath: StructuredCardItemBasePath;
  sectionIndex: number;
  sectionId: string;
  idPrefix: string;
  disabled?: boolean;
  showError?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
}>;

function toSectionBlockFieldPath(path: string): SectionBlockFieldPath {
  return path as SectionBlockFieldPath;
}

export function StructuredCardSectionEditor({
  control,
  itemBasePath,
  sectionIndex,
  sectionId,
  idPrefix,
  disabled = false,
  showError = false,
  canRemove = true,
  onRemove,
}: StructuredCardSectionEditorProps) {
  const t = useTranslations();

  const sectionBasePath =
    `${itemBasePath}.sections.${sectionIndex}` as StructuredCardSectionBasePath;

  const labelCtrl = useController({
    name: toSectionBlockFieldPath(`${sectionBasePath}.label`),
    control,
  });

  const contentCtrl = useController({
    name: toSectionBlockFieldPath(`${sectionBasePath}.content`),
    control,
  });

  const labelIds = createFieldIds(`${idPrefix}-section-${sectionId}`, "label");
  const contentIds = createFieldIds(
    `${idPrefix}-section-${sectionId}`,
    "content",
  );

  const shouldShowLabelError = showError || labelCtrl.fieldState.isTouched;

  const shouldShowContentError = showError || contentCtrl.fieldState.isTouched;

  const labelInvalid =
    shouldShowLabelError && Boolean(labelCtrl.fieldState.error?.message);

  const labelError =
    shouldShowLabelError && labelCtrl.fieldState.error?.message
      ? String(labelCtrl.fieldState.error.message)
      : undefined;

  const contentInvalid =
    shouldShowContentError && Boolean(contentCtrl.fieldState.error?.message);

  const contentError =
    shouldShowContentError && contentCtrl.fieldState.error?.message
      ? String(contentCtrl.fieldState.error.message)
      : undefined;

  return (
    <Card variant="default" visualMode="studio" className="relative">
      <CardContent className={cn(STACK_SM)}>
        <div className="absolute right-2 top-2">
          <DeleteButton
            disabled={!canRemove || disabled}
            onConfirmDelete={onRemove}
            ariaLabel={t("common.delete")}
            title={t("common.delete")}
          />
        </div>

        <InputField
          ids={labelIds}
          inputRef={labelCtrl.field.ref}
          label={t(
            "studio.cellEditorTabs.structuredCardCellEditor.sectionLabelLabel",
          )}
          value={String(labelCtrl.field.value ?? "")}
          onChange={labelCtrl.field.onChange}
          onBlur={labelCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.structuredCardCellEditor.sectionLabelPlaceholder",
          )}
          disabled={disabled}
          invalid={labelInvalid}
          error={labelError}
        />

        <TextareaField
          ids={contentIds}
          label={t(
            "studio.cellEditorTabs.structuredCardCellEditor.sectionContentLabel",
          )}
          value={String(contentCtrl.field.value ?? "")}
          onChange={contentCtrl.field.onChange}
          onBlur={contentCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.structuredCardCellEditor.sectionContentPlaceholder",
          )}
          disabled={disabled}
          rows={4}
          invalid={contentInvalid}
          error={contentError}
        />
      </CardContent>
    </Card>
  );
}
