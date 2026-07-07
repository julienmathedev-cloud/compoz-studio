"use client";

/**
 * @file apps/studio/src/features/settings/menus/_shared/MenuFieldsItem.tsx
 * @layer studio/features/settings/menus/shared
 *
 * @description
 * Editable studio row for a menu item label, link fields, drag handle, and delete action.
 *
 * @remarks
 * - Receives RHF controller fields from the parent so the sortable row stays presentation-focused.
 * - Link behavior and validation are delegated to `LinkFieldsItem` and the parent form.
 */

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { LinkFieldsItem } from "@compoz/studio/components/molecules/fields/LinkFieldsItem";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { MENU_ITEM_LAYOUT, ROW_END } from "@compoz/ui/styles/studio/layout";

type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

type RHFField = ControllerRenderProps<FieldValues>;

type DragHandleProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "type" | "children"
>;

type MenuFieldsItemProps = Readonly<{
  idPrefix: string;

  labelField: RHFField;
  hrefField: RHFField;
  newTabField: RHFField;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  invalid?: RowInvalidFlags;
  error?: RowErrorMessages;
  /** Lets the parent trigger href validation after link-field interactions. */
  onHrefValidateNow?: (markTouched?: boolean) => void;
  dragHandleProps?: DragHandleProps;
  onRemove: () => void;
  hasChildren?: boolean;
  disabled?: boolean;
}>;

export function MenuFieldsItem({
  idPrefix,
  labelField,
  hrefField,
  newTabField,
  invalid,
  error,
  internalPageOptions,
  onHrefValidateNow,
  dragHandleProps,
  onRemove,
  hasChildren = false,
  disabled = false,
}: MenuFieldsItemProps) {
  const labelIds = createFieldIds(idPrefix, "label");
  const linkIdPrefix = `${idPrefix}-link`;
  const t = useTranslations();

  return (
    <div className={cn("grid grid-cols-[auto_1fr] gap-3")}>
      <div className="pt-[2.2rem]">
        <DragHandle
          className={cn(disabled && "pointer-events-none opacity-50")}
          disabled={disabled}
          {...dragHandleProps}
        />
      </div>

      <div className={cn(MENU_ITEM_LAYOUT)}>
        <InputField
          ids={labelIds}
          inputRef={labelField.ref}
          label={t("studio.menuFieldsItem.labelField.label")}
          value={String(labelField.value ?? "")}
          onChange={(v) => labelField.onChange(v)}
          onBlur={labelField.onBlur}
          placeholder={t("studio.menuFieldsItem.labelField.placeholder")}
          disabled={disabled}
          invalid={invalid?.label}
          error={error?.label}
          help
        />

        <LinkFieldsItem
          idPrefix={linkIdPrefix}
          href={String(hrefField.value ?? "")}
          onHrefChange={(next) => {
            hrefField.onChange(next);
          }}
          newTab={Boolean(newTabField.value)}
          onNewTabChange={(next) => {
            newTabField.onChange(next);
          }}
          disabled={disabled}
          parentHasChildren={hasChildren}
          invalid={invalid?.href}
          error={error?.href}
          internalPageOptions={internalPageOptions}
          onValidateNow={(markTouched) => {
            if (markTouched) {
              hrefField.onBlur();
              newTabField.onBlur?.();
            }

            onHrefValidateNow?.(markTouched);
          }}
        />

        <div className={cn(ROW_END)}>
          <div className="mt-[1.6rem] flex h-9 items-center">
            <DeleteButton
              disabled={disabled}
              size="icon"
              onConfirmDelete={onRemove}
              confirm={{
                title: t("studio.menuFieldsItem.confirmDelete.title"),
                description: t(
                  "studio.menuFieldsItem.confirmDelete.description",
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

MenuFieldsItem.displayName = "MenuFieldsItem";
