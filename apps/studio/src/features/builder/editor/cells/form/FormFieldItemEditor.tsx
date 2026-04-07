"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/form/FormFieldItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/form
 *
 * @description
 * Éditeur RHF-aware d’un champ individuel pour FormCell.
 *
 * @remarks
 * - Connecté directement à RHF via `useController`.
 * - Gère les champs : name, label, type, placeholder, required.
 * - Suit la règle standard builder :
 *   `showError || fieldState.isTouched`.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type FormFieldType = "text" | "email" | "textarea";

const FIELD_TYPES = ["text", "email", "textarea"] as const;

type FormFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type FormFieldItemPath = `${FormFieldBasePath}.fields.${number}`;

export type FormFieldItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: FormFieldBasePath;
  index: number;
  idPrefix: string;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
}>;

export function FormFieldItemEditor({
  control,
  basePath,
  index,
  idPrefix,
  disabled = false,
  canRemove = true,
  onRemove,
  showError = false,
}: FormFieldItemEditorProps) {
  const t = useTranslations();

  const itemPath = `${basePath}.fields.${index}` as FormFieldItemPath;

  const nameCtrl = useController({
    name: `${itemPath}.name` as `${FormFieldItemPath}.name`,
    control,
  });

  const labelCtrl = useController({
    name: `${itemPath}.label` as `${FormFieldItemPath}.label`,
    control,
  });

  const typeCtrl = useController({
    name: `${itemPath}.type` as `${FormFieldItemPath}.type`,
    control,
  });

  const placeholderCtrl = useController({
    name: `${itemPath}.placeholder` as `${FormFieldItemPath}.placeholder`,
    control,
  });

  const requiredCtrl = useController({
    name: `${itemPath}.required` as `${FormFieldItemPath}.required`,
    control,
  });

  const nameIds = createFieldIds(idPrefix, "name");
  const labelIds = createFieldIds(idPrefix, "label");
  const typeIds = createFieldIds(idPrefix, "type");
  const placeholderIds = createFieldIds(idPrefix, "placeholder");
  const requiredIds = createFieldIds(idPrefix, "required");

  const fieldType: FormFieldType =
    typeCtrl.field.value &&
    FIELD_TYPES.includes(typeCtrl.field.value as FormFieldType)
      ? (typeCtrl.field.value as FormFieldType)
      : "text";

  const shouldShowNameError = showError || nameCtrl.fieldState.isTouched;
  const shouldShowLabelError = showError || labelCtrl.fieldState.isTouched;

  const nameInvalid =
    shouldShowNameError && Boolean(nameCtrl.fieldState.error?.message);

  const nameError =
    shouldShowNameError && nameCtrl.fieldState.error?.message
      ? String(nameCtrl.fieldState.error.message)
      : undefined;

  const labelInvalid =
    shouldShowLabelError && Boolean(labelCtrl.fieldState.error?.message);

  const labelError =
    shouldShowLabelError && labelCtrl.fieldState.error?.message
      ? String(labelCtrl.fieldState.error.message)
      : undefined;

  return (
    <Card variant="default" visualMode="studio" className="relative">
      <CardContent className={cn(STACK_MD)}>
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
            ids={nameIds}
            inputRef={nameCtrl.field.ref}
            label={t("studio.cellEditorTabs.formCellEditor.fieldNameLabel")}
            value={String(nameCtrl.field.value ?? "")}
            onChange={nameCtrl.field.onChange}
            onBlur={nameCtrl.field.onBlur}
            placeholder={t(
              "studio.cellEditorTabs.formCellEditor.fieldNamePlaceholder",
            )}
            disabled={disabled}
            help={t("studio.cellEditorTabs.formCellEditor.fieldNameHelp")}
            invalid={nameInvalid}
            error={nameError}
          />

          <InputField
            ids={labelIds}
            inputRef={labelCtrl.field.ref}
            label={t("studio.cellEditorTabs.formCellEditor.fieldLabelLabel")}
            value={String(labelCtrl.field.value ?? "")}
            onChange={labelCtrl.field.onChange}
            onBlur={labelCtrl.field.onBlur}
            placeholder={t(
              "studio.cellEditorTabs.formCellEditor.fieldLabelPlaceholder",
            )}
            disabled={disabled}
            help={t("studio.cellEditorTabs.formCellEditor.fieldLabelHelp")}
            invalid={labelInvalid}
            error={labelError}
          />
        </FormGrid>

        <FormGrid>
          <SelectField
            ids={typeIds}
            label={t("studio.cellEditorTabs.formCellEditor.fieldTypeLabel")}
            value={fieldType}
            onChange={(next) => {
              typeCtrl.field.onChange(next as FormFieldType);
            }}
            items={FIELD_TYPES.map((item) => ({
              value: item,
              label: t(
                `studio.cellEditorTabs.formCellEditor.fieldTypes.${item}`,
              ),
            }))}
            disabled={disabled}
            help={t("studio.cellEditorTabs.formCellEditor.fieldTypeHelp")}
          />

          <InputField
            ids={placeholderIds}
            inputRef={placeholderCtrl.field.ref}
            label={t(
              "studio.cellEditorTabs.formCellEditor.fieldPlaceholderLabel",
            )}
            value={String(placeholderCtrl.field.value ?? "")}
            onChange={placeholderCtrl.field.onChange}
            onBlur={placeholderCtrl.field.onBlur}
            placeholder={t(
              "studio.cellEditorTabs.formCellEditor.fieldPlaceholderPlaceholder",
            )}
            disabled={disabled}
            help={t(
              "studio.cellEditorTabs.formCellEditor.fieldPlaceholderHelp",
            )}
          />
        </FormGrid>

        <SwitchField
          ids={requiredIds}
          label={t("studio.cellEditorTabs.formCellEditor.fieldRequiredLabel")}
          checked={Boolean(requiredCtrl.field.value)}
          onCheckedChange={requiredCtrl.field.onChange}
          disabled={disabled}
          help={t("studio.cellEditorTabs.formCellEditor.fieldRequiredHelp")}
        />
      </CardContent>
    </Card>
  );
}

FormFieldItemEditor.displayName = "FormFieldItemEditor";
