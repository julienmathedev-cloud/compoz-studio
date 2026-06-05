"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/form/FormCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur RHF-aware d’une FormCell (formulaire de contact).
 *
 * @remarks
 * - Connecté directement à RHF via `useController` et `useFieldArray`.)
 * - Stocke la destination sous forme d’adresse email brute.
 * - S’aligne sur le standard builder :
 *   `showError || fieldState.isTouched`.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { ButtonIconFields } from "@compoz/studio/components/molecules/fields/ButtonIconFields";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { FormFieldItemEditor } from "@compoz/studio/features/builder/editor/cells/form/FormFieldItemEditor";
import { createEmptyFormField } from "@compoz/studio/features/pages/mappers/cells-form";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

type FormFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type FormSubmitButtonBasePath = `${FormFieldBasePath}.submitButton`;
type FormFieldsPath = `${FormFieldBasePath}.fields`;

const FORM_BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
] as const;

type FormButtonVariant = (typeof FORM_BUTTON_VARIANTS)[number];
type ButtonIconPosition = "before" | "after";

type FormFieldArrayItem = {
  id: string;
  fieldId: string;
};

export type FormCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
}>;

export function FormCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
}: FormCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as FormFieldBasePath;

  const fieldsPath = `${basePath}.fields` as FormFieldsPath;

  const toCtrl = useController({
    name: `${basePath}.to` as `${FormFieldBasePath}.to`,
    control,
  });

  const submitButtonLabelCtrl = useController({
    name: `${basePath}.submitButton.label` as `${FormSubmitButtonBasePath}.label`,
    control,
    defaultValue: "",
  });

  const submitButtonVariantCtrl = useController({
    name: `${basePath}.submitButton.variant` as `${FormSubmitButtonBasePath}.variant`,
    control,
    defaultValue: "default",
  });

  const submitButtonIconCtrl = useController({
    name: `${basePath}.submitButton.icon` as `${FormSubmitButtonBasePath}.icon`,
    control,
    defaultValue: null,
  });

  const submitButtonIconPositionCtrl = useController({
    name: `${basePath}.submitButton.iconPosition` as `${FormSubmitButtonBasePath}.iconPosition`,
    control,
    defaultValue: "before",
  });

  const successMessageCtrl = useController({
    name: `${basePath}.successMessage` as `${FormFieldBasePath}.successMessage`,
    control,
  });

  const errorMessageCtrl = useController({
    name: `${basePath}.errorMessage` as `${FormFieldBasePath}.errorMessage`,
    control,
  });

  const { fields, append, remove } = useFieldArray<
    SectionBlockFormValues,
    FormFieldsPath,
    "fieldId"
  >({
    control,
    name: fieldsPath,
    keyName: "fieldId",
  });

  const toIds = createFieldIds(idPrefix, "to");
  const submitLabelIds = createFieldIds(idPrefix, "submitButtonLabel");
  const submitButtonVariantIds = createFieldIds(
    idPrefix,
    "submitButtonVariant",
  );
  const successMessageIds = createFieldIds(idPrefix, "successMessage");
  const errorMessageIds = createFieldIds(idPrefix, "errorMessage");

  const shouldShowToError = showError || toCtrl.fieldState.isTouched;
  const shouldShowSubmitLabelError =
    showError || submitButtonLabelCtrl.fieldState.isTouched;

  const toInvalid =
    shouldShowToError && Boolean(toCtrl.fieldState.error?.message);

  const toError =
    shouldShowToError && toCtrl.fieldState.error?.message
      ? String(toCtrl.fieldState.error.message)
      : undefined;

  const submitLabelInvalid =
    shouldShowSubmitLabelError &&
    Boolean(submitButtonLabelCtrl.fieldState.error?.message);

  const submitLabelError =
    shouldShowSubmitLabelError &&
    submitButtonLabelCtrl.fieldState.error?.message
      ? String(submitButtonLabelCtrl.fieldState.error.message)
      : undefined;

  const rawSubmitButtonVariant = submitButtonVariantCtrl.field.value;
  const submitButtonVariant: FormButtonVariant =
    rawSubmitButtonVariant &&
    FORM_BUTTON_VARIANTS.includes(rawSubmitButtonVariant as FormButtonVariant)
      ? (rawSubmitButtonVariant as FormButtonVariant)
      : "default";

  const submitButtonIcon = submitButtonIconCtrl.field.value ?? null;

  const rawSubmitButtonIconPosition = submitButtonIconPositionCtrl.field.value;

  const submitButtonIconPosition: ButtonIconPosition =
    rawSubmitButtonIconPosition === "after" ? "after" : "before";

  return (
    <div className={cn(STACK_MD)}>
      <FormGrid>
        <InputField
          ids={toIds}
          inputRef={toCtrl.field.ref}
          label={t("studio.cellEditorTabs.formCellEditor.toLabel")}
          value={String(toCtrl.field.value ?? "")}
          onChange={(next) => {
            toCtrl.field.onChange(next);
          }}
          onBlur={toCtrl.field.onBlur}
          placeholder={t("studio.cellEditorTabs.formCellEditor.toPlaceholder")}
          disabled={disabled}
          help={t("studio.cellEditorTabs.formCellEditor.toHelp")}
          invalid={toInvalid}
          error={toError}
        />

        <InputField
          ids={submitLabelIds}
          inputRef={submitButtonLabelCtrl.field.ref}
          label={t("studio.cellEditorTabs.formCellEditor.submitLabelLabel")}
          value={String(submitButtonLabelCtrl.field.value ?? "")}
          onChange={submitButtonLabelCtrl.field.onChange}
          onBlur={submitButtonLabelCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.formCellEditor.submitLabelPlaceholder",
          )}
          disabled={disabled}
          help={t("studio.cellEditorTabs.formCellEditor.submitLabelHelp")}
          invalid={submitLabelInvalid}
          error={submitLabelError}
        />
      </FormGrid>

      <FormGrid>
        <ButtonIconFields
          idPrefix={`${idPrefix}-submit-button-icon`}
          icon={submitButtonIcon}
          iconPosition={submitButtonIconPosition}
          onIconChange={submitButtonIconCtrl.field.onChange}
          onIconPositionChange={submitButtonIconPositionCtrl.field.onChange}
          disabled={disabled}
        />

        <SelectField
          ids={submitButtonVariantIds}
          label={t("studio.cellEditorTabs.formCellEditor.variantButtonLabel")}
          value={submitButtonVariant}
          onChange={(next) => {
            submitButtonVariantCtrl.field.onChange(next as FormButtonVariant);
          }}
          items={FORM_BUTTON_VARIANTS.map((variant) => ({
            value: variant,
            label: t(
              `studio.cellEditorTabs.formCellEditor.variants.${variant}`,
            ),
          }))}
          disabled={disabled}
          help={t("studio.cellEditorTabs.formCellEditor.variantButtonHelp")}
        />
      </FormGrid>

      <FormGrid>
        <TextareaField
          ids={successMessageIds}
          label={t("studio.cellEditorTabs.formCellEditor.successMessageLabel")}
          value={String(successMessageCtrl.field.value ?? "")}
          onChange={successMessageCtrl.field.onChange}
          onBlur={successMessageCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.formCellEditor.successMessagePlaceholder",
          )}
          disabled={disabled}
          rows={3}
          help={t("studio.cellEditorTabs.formCellEditor.successMessageHelp")}
        />

        <TextareaField
          ids={errorMessageIds}
          label={t("studio.cellEditorTabs.formCellEditor.errorMessageLabel")}
          value={String(errorMessageCtrl.field.value ?? "")}
          onChange={errorMessageCtrl.field.onChange}
          onBlur={errorMessageCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.formCellEditor.errorMessagePlaceholder",
          )}
          disabled={disabled}
          rows={3}
          help={t("studio.cellEditorTabs.formCellEditor.errorMessageHelp")}
        />
      </FormGrid>

      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.formCellEditor.fieldsLabel")}
        </Text>

        <Text as="p" variant="muted" className="text-xs">
          {t("studio.cellEditorTabs.formCellEditor.fieldsHelp")}
        </Text>
      </div>

      <div className={cn(STACK_MD)}>
        {(fields as FormFieldArrayItem[]).map((field, index) => (
          <FormFieldItemEditor
            key={field.fieldId}
            control={control}
            basePath={basePath}
            index={index}
            idPrefix={`${idPrefix}-field-${field.id}`}
            disabled={disabled}
            canRemove={fields.length > 1}
            onRemove={() => remove(index)}
            showError={showError}
          />
        ))}

        <div>
          <AddEmptyCardButton
            onClick={() => append(createEmptyFormField())}
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

FormCellEditor.displayName = "FormCellEditor";
