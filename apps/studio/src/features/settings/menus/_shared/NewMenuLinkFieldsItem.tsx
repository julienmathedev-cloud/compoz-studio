"use client";

/**
 * @file apps/studio/src/features/settings/menus/_shared/NewMenuLinkFieldsItem.tsx
 * @layer ui/studio/molecules
 *
 * @description
 * Wrapper RHF de `LinkFieldsItem` (éditeur de lien controlled).
 */

import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { LinkFieldsItem } from "@compoz/studio/features/settings/menus/_shared/LinkFieldsItem";

type RHFField = ControllerRenderProps<FieldValues>;

type NewMenuLinkFieldsItemProps = Readonly<{
  idPrefix: string;

  hrefField: RHFField;
  newTabField: RHFField;

  disabled?: boolean;
  parentHasChildren?: boolean;

  invalid?: boolean;
  error?: string;

  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  onValidateNow?: (markTouched?: boolean) => void;
}>;

export function NewMenuLinkFieldsItem({
  idPrefix,
  hrefField,
  newTabField,
  disabled,
  parentHasChildren = false,
  invalid,
  error,
  internalPageOptions,
  onValidateNow,
}: NewMenuLinkFieldsItemProps) {
  const href = String(hrefField.value ?? "");
  const newTab = Boolean(newTabField.value);

  return (
    <LinkFieldsItem
      idPrefix={idPrefix}
      href={href}
      onHrefChange={(next) => {
        hrefField.onChange(next);
      }}
      newTab={newTab}
      onNewTabChange={(next) => {
        newTabField.onChange(next);
      }}
      disabled={disabled}
      parentHasChildren={parentHasChildren}
      invalid={invalid}
      error={error}
      internalPageOptions={internalPageOptions}
      onValidateNow={(markTouched) => {
        // RHF : blur/touched si demandé
        if (markTouched) {
          hrefField.onBlur();
          newTabField.onBlur?.();
        }

        onValidateNow?.(markTouched);
      }}
    />
  );
}

NewMenuLinkFieldsItem.displayName = "NewMenuLinkFieldsItem";
