"use client";

/**
 * @file apps/studio/src/features/settings/menus/legal-menu/components/molecules/LegalMenuItemRow.tsx
 * @layer studio/features/settings/menus/legal-menu/components/molecules
 *
 * @description
 * RHF-connected sortable row for editing one legal menu item.
 *
 * @remarks
 * - Keeps `useController` inside the row so each sortable item owns its field subscriptions.
 * - Auto-fills an internal href from the label only while the href field is still an untouched draft.
 */

import { useSortable } from "@dnd-kit/sortable";
import {
  useController,
  type Control,
  type UseFormTrigger,
} from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { MenuFieldsItem } from "@compoz/studio/features/settings/menus/_shared/MenuFieldsItem";
import { resolveLinkFlags, slugifyPath } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";

type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

type LegalMenuItemRowProps = Readonly<{
  sortableId: string;
  index: number;
  control: Control<LegalMenuFormValues>;
  trigger: UseFormTrigger<LegalMenuFormValues>;
  disabled: boolean;
  showError: boolean;
  rowIdPrefix: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  onRemove: () => void;
}>;

export function LegalMenuItemRow({
  sortableId,
  index,
  control,
  trigger,
  disabled,
  showError,
  rowIdPrefix,
  internalPageOptions,
  onRemove,
}: LegalMenuItemRowProps) {
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

  const labelCtrl = useController({
    name: `items.${index}.label` as const,
    control,
  });

  const hrefCtrl = useController({
    name: `items.${index}.href` as const,
    control,
  });

  const newTabCtrl = useController({
    name: `items.${index}.newTab` as const,
    control,
  });

  const invalid: RowInvalidFlags = {
    label:
      (showError || labelCtrl.fieldState.isTouched) &&
      Boolean(labelCtrl.fieldState.error?.message),
    href:
      (showError || hrefCtrl.fieldState.isTouched) &&
      Boolean(hrefCtrl.fieldState.error?.message),
  };

  const error: RowErrorMessages = {
    label:
      (showError || labelCtrl.fieldState.isTouched) &&
      labelCtrl.fieldState.error?.message
        ? String(labelCtrl.fieldState.error.message)
        : undefined,
    href:
      (showError || hrefCtrl.fieldState.isTouched) &&
      hrefCtrl.fieldState.error?.message
        ? String(hrefCtrl.fieldState.error.message)
        : undefined,
  };

  /** Forces href validation after programmatic link-field updates. */
  const validateHrefNow = (markTouched?: boolean) => {
    if (disabled) return;

    if (markTouched) {
      hrefCtrl.field.onBlur();
    }

    void trigger(`items.${index}.href` as const);
  };

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-60")}
    >
      <MenuFieldsItem
        idPrefix={rowIdPrefix}
        disabled={disabled}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        labelField={{
          name: labelCtrl.field.name,
          value: labelCtrl.field.value,
          onChange: labelCtrl.field.onChange,
          onBlur: () =>
            handleLabelBlur(
              index,
              labelCtrl.field,
              hrefCtrl.field,
              hrefCtrl.fieldState.isTouched,
              trigger,
            ),
          ref: labelCtrl.field.ref,
        }}
        hrefField={hrefCtrl.field}
        newTabField={newTabCtrl.field}
        invalid={invalid}
        error={error}
        onHrefValidateNow={validateHrefNow}
        internalPageOptions={internalPageOptions}
        onRemove={onRemove}
      />
    </div>
  );
}

/**
 * Auto-fills draft internal links from the label without overwriting user-edited hrefs.
 */
function handleLabelBlur(
  index: number,
  labelField: {
    value: unknown;
    onBlur: () => void;
    onChange: (value: string) => void;
  },
  hrefField: {
    value: unknown;
    onBlur: () => void;
    onChange: (value: string) => void;
  },
  hrefTouched: boolean,
  trigger: UseFormTrigger<LegalMenuFormValues>,
) {
  labelField.onBlur();

  if (hrefTouched) return;

  const hrefNow = String(hrefField.value ?? "");
  const flags = resolveLinkFlags(hrefNow);

  if (flags.rawExternal) return;

  const label = String(labelField.value ?? "").trim();
  if (!label) return;

  const currentHref = hrefNow.trim();

  // New rows start with `/`; keep it editable until the label can produce a better internal slug.
  const isEmptyInternalDraft = currentHref === "" || currentHref === "/";
  if (!isEmptyInternalDraft) return;

  const slug = slugifyPath(label);
  if (!slug) return;

  const nextHref = `/${slug}`;
  if (currentHref === nextHref) return;

  hrefField.onChange(nextHref);

  void trigger(`items.${index}.href` as const);
}
