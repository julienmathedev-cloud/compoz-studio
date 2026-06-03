"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/buttons/ButtonItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/buttons
 *
 * @description
 * Éditeur RHF-aware d’un bouton individuel pour ButtonsCell.
 *
 * @remarks
 * - Connecté directement à RHF via `useController`.
 * - Reprend le pattern card utilisé par les éditeurs de listes.
 * - Réutilise `LinkFieldsItem` pour la gestion du href.
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - L’affichage des erreurs repose sur une règle unique :
 *   `showError || fieldState.isTouched`.
 * - Aligné sur le pattern du menu légal :
 *   l’ID sortable est passé explicitement via `sortableId`.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { LinkFieldsItem } from "@compoz/studio/components/molecules/fields/LinkFieldsItem";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { ButtonItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost"] as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonsFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type ButtonItemBasePath = `${ButtonsFieldBasePath}.items.${number}`;

export type ButtonItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: ButtonsFieldBasePath;
  index: number;
  idPrefix: string;
  sortableId: string;
  watchedItem?: ButtonItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
}>;

export function ButtonItemEditor({
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
}: ButtonItemEditorProps) {
  const t = useTranslations();

  const itemBasePath = `${basePath}.items.${index}` as ButtonItemBasePath;

  const labelCtrl = useController({
    name: `${itemBasePath}.label` as `${ButtonItemBasePath}.label`,
    control,
    defaultValue: watchedItem?.label ?? "",
  });

  const hrefCtrl = useController({
    name: `${itemBasePath}.href` as `${ButtonItemBasePath}.href`,
    control,
    defaultValue: watchedItem?.href ?? "",
  });

  const variantCtrl = useController({
    name: `${itemBasePath}.variant` as `${ButtonItemBasePath}.variant`,
    control,
    defaultValue: watchedItem?.variant ?? "default",
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

  const labelIds = createFieldIds(idPrefix, "label");
  const variantIds = createFieldIds(idPrefix, "variant");
  const linkIdPrefix = `${idPrefix}-link`;

  const shouldShowLabelError = showError || labelCtrl.fieldState.isTouched;

  const labelInvalid =
    shouldShowLabelError && Boolean(labelCtrl.fieldState.error?.message);

  const labelError =
    shouldShowLabelError && labelCtrl.fieldState.error?.message
      ? String(labelCtrl.fieldState.error.message)
      : undefined;

  const labelValue = String(labelCtrl.field.value ?? watchedItem?.label ?? "");
  const hrefValue = String(hrefCtrl.field.value ?? watchedItem?.href ?? "");

  const rawVariant = variantCtrl.field.value ?? watchedItem?.variant;
  const currentVariant: ButtonVariant =
    rawVariant && BUTTON_VARIANTS.includes(rawVariant as ButtonVariant)
      ? (rawVariant as ButtonVariant)
      : "default";

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
            <InputField
              ids={labelIds}
              inputRef={labelCtrl.field.ref}
              label={t("studio.cellEditorTabs.buttonsCellEditor.labelLabel")}
              value={labelValue}
              onChange={labelCtrl.field.onChange}
              onBlur={labelCtrl.field.onBlur}
              disabled={disabled}
              placeholder={t(
                "studio.cellEditorTabs.buttonsCellEditor.labelPlaceholder",
              )}
              help={t("studio.cellEditorTabs.buttonsCellEditor.labelHelp")}
              invalid={labelInvalid}
              error={labelError}
            />

            <LinkFieldsItem
              idPrefix={linkIdPrefix}
              href={hrefValue}
              onHrefChange={hrefCtrl.field.onChange}
              disabled={disabled}
              allowTelAndMailto={true}
            />

            <SelectField
              ids={variantIds}
              label={t("studio.cellEditorTabs.buttonsCellEditor.variantLabel")}
              value={currentVariant}
              onChange={(next) => {
                variantCtrl.field.onChange(next as ButtonVariant);
              }}
              items={BUTTON_VARIANTS.map((variant) => ({
                value: variant,
                label: t(
                  `studio.cellEditorTabs.buttonsCellEditor.variants.${variant}`,
                ),
              }))}
              disabled={disabled}
              help={t("studio.cellEditorTabs.buttonsCellEditor.variantHelp")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

ButtonItemEditor.displayName = "ButtonItemEditor";
