"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/form/FormSelectOptionItemEditor.tsx
 * @layer studio/features/builder/editor/cells/form
 *
 * @description
 * RHF-aware editor for one option belonging to a select form field.
 *
 * @remarks
 * - Edits the user-facing label and stable submitted value.
 * - Shows validation errors only after `showError` or the related input has been touched.
 * - The parent controls whether the option may be removed.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import type { FormSelectOptionItemPath } from "@compoz/studio/features/builder/editor/cells/form/form-field-editor.types";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

export type FormSelectOptionItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  optionPath: FormSelectOptionItemPath;
  idPrefix: string;
  disabled: boolean;
  canRemove: boolean;
  onRemove: () => void;
  showError: boolean;
}>;

export function FormSelectOptionItemEditor({
  control,
  optionPath,
  idPrefix,
  disabled,
  canRemove,
  onRemove,
  showError,
}: FormSelectOptionItemEditorProps) {
  const t = useTranslations();

  const labelCtrl = useController({
    name: `${optionPath}.label` as `${FormSelectOptionItemPath}.label`,
    control,
  });

  const valueCtrl = useController({
    name: `${optionPath}.value` as `${FormSelectOptionItemPath}.value`,
    control,
  });

  const labelIds = createFieldIds(idPrefix, "label");
  const valueIds = createFieldIds(idPrefix, "value");

  const shouldShowLabelError = showError || labelCtrl.fieldState.isTouched;

  const shouldShowValueError = showError || valueCtrl.fieldState.isTouched;

  const labelError =
    shouldShowLabelError && labelCtrl.fieldState.error?.message
      ? String(labelCtrl.fieldState.error.message)
      : undefined;

  const valueError =
    shouldShowValueError && valueCtrl.fieldState.error?.message
      ? String(valueCtrl.fieldState.error.message)
      : undefined;

  return (
    <Card variant="default" visualMode="studio" className="relative">
      <CardContent className={cn(STACK_SM)}>
        <div className="absolute right-3 top-2">
          <DeleteButton
            size="icon"
            disabled={!canRemove || disabled}
            onConfirmDelete={onRemove}
            ariaLabel={t("common.delete")}
            title={t("common.delete")}
          />
        </div>

        <FormGrid>
          <InputField
            ids={labelIds}
            inputRef={labelCtrl.field.ref}
            label={t(
              "studio.cellEditorTabs.formCellEditor.fieldOptionLabelLabel",
            )}
            value={String(labelCtrl.field.value ?? "")}
            onChange={labelCtrl.field.onChange}
            onBlur={labelCtrl.field.onBlur}
            placeholder={t(
              "studio.cellEditorTabs.formCellEditor.fieldOptionLabelPlaceholder",
            )}
            disabled={disabled}
            invalid={Boolean(labelError)}
            error={labelError}
          />

          <InputField
            ids={valueIds}
            inputRef={valueCtrl.field.ref}
            label={t(
              "studio.cellEditorTabs.formCellEditor.fieldOptionValueLabel",
            )}
            value={String(valueCtrl.field.value ?? "")}
            onChange={valueCtrl.field.onChange}
            onBlur={valueCtrl.field.onBlur}
            placeholder={t(
              "studio.cellEditorTabs.formCellEditor.fieldOptionValuePlaceholder",
            )}
            disabled={disabled}
            invalid={Boolean(valueError)}
            error={valueError}
          />
        </FormGrid>
      </CardContent>
    </Card>
  );
}

FormSelectOptionItemEditor.displayName = "FormSelectOptionItemEditor";
