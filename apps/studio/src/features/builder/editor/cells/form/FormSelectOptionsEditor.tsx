"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/form/FormSelectOptionsEditor.tsx
 * @layer studio/features/builder/editor/cells/form
 *
 * @description
 * RHF-aware collection editor for the options of one select form field.
 *
 * @remarks
 * - Must only be mounted for a field whose type is `select`.
 * - Uses a stable RHF field-array key for each option.
 * - Prevents removing the final remaining option.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { FormSelectOptionItemEditor } from "@compoz/studio/features/builder/editor/cells/form/FormSelectOptionItemEditor";
import type {
  FormFieldOptionsPath,
  FormSelectOptionItemPath,
} from "@compoz/studio/features/builder/editor/cells/form/form-field-editor.types";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type FormSelectOptionFieldArrayItem = Readonly<{
  optionId: string;
}>;

export type FormSelectOptionsEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  optionsPath: FormFieldOptionsPath;
  idPrefix: string;
  disabled: boolean;
  showError: boolean;
}>;

export function FormSelectOptionsEditor({
  control,
  optionsPath,
  idPrefix,
  disabled,
  showError,
}: FormSelectOptionsEditorProps) {
  const t = useTranslations();

  const {
    fields: options,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray<SectionBlockFormValues, FormFieldOptionsPath, "optionId">({
    control,
    name: optionsPath,
    keyName: "optionId",
  });

  const optionItems = options as ReadonlyArray<FormSelectOptionFieldArrayItem>;

  return (
    <div className={cn(STACK_SM)}>
      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.formCellEditor.fieldOptionsLabel")}
        </Text>

        <Text as="p" variant="muted" className="text-xs">
          {t("studio.cellEditorTabs.formCellEditor.fieldOptionsHelp")}
        </Text>
      </div>

      <div className={cn(STACK_SM)}>
        {optionItems.map((option, optionIndex) => (
          <FormSelectOptionItemEditor
            key={option.optionId}
            control={control}
            optionPath={
              `${optionsPath}.${optionIndex}` as FormSelectOptionItemPath
            }
            idPrefix={`${idPrefix}-option-${option.optionId}`}
            disabled={disabled}
            canRemove={optionItems.length > 1}
            onRemove={() => removeOption(optionIndex)}
            showError={showError}
          />
        ))}

        <div>
          <AddEmptyCardButton
            onClick={() => appendOption({ label: "", value: "" })}
            disabled={disabled}
            ariaLabel={t("common.add")}
            tooltip={t("common.add")}
            compact
          />
        </div>
      </div>
    </div>
  );
}

FormSelectOptionsEditor.displayName = "FormSelectOptionsEditor";
