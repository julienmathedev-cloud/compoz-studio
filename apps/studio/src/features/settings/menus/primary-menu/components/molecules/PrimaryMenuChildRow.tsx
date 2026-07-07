"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/molecules/PrimaryMenuChildRow.tsx
 * @layer studio/features/settings/menus/primary-menu/components/molecules
 *
 * @description
 * RHF-connected sortable row for editing one child item in the primary menu.
 *
 * @remarks
 * - Keeps `useController` inside the row so each sortable child owns its field subscriptions.
 * - Auto-fills an internal href from the label only while the href field is still an untouched draft.
 */

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { MenuFieldsItem } from "@compoz/studio/features/settings/menus/_shared/MenuFieldsItem";
import { Separator } from "@compoz/ui/components/ui/separator";
import { resolveLinkFlags, slugifyPath } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import { useSortable } from "@dnd-kit/sortable";
import type {
  Control,
  ControllerRenderProps,
  UseFormTrigger,
} from "react-hook-form";
import { useController } from "react-hook-form";

type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

type ChildRowProps = Readonly<{
  sortableId: string;
  pIdx: number;
  cIdx: number;
  control: Control<PrimaryMenuFormValues>;
  trigger: UseFormTrigger<PrimaryMenuFormValues>;
  disabled: boolean;
  showError: boolean;
  childIdPrefix: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  onRemove: () => void;
}>;

export function PrimaryMenuChildRow({
  sortableId,
  pIdx,
  cIdx,
  control,
  trigger,
  disabled,
  showError,
  childIdPrefix,
  internalPageOptions,
  onRemove,
}: ChildRowProps) {
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
    name: `items.${pIdx}.children.${cIdx}.label` as const,
    control,
  });

  const hrefCtrl = useController({
    name: `items.${pIdx}.children.${cIdx}.href` as const,
    control,
  });

  const newTabCtrl = useController({
    name: `items.${pIdx}.children.${cIdx}.newTab` as const,
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
    if (markTouched) {
      hrefCtrl.field.onBlur();
    }

    void trigger(`items.${pIdx}.children.${cIdx}.href` as const);
  };

  /** Auto-fills draft internal links from the label without overwriting user-edited hrefs. */
  const handleLabelBlur = () => {
    labelCtrl.field.onBlur();

    const hrefNow = String(hrefCtrl.field.value ?? "");
    const flags = resolveLinkFlags(hrefNow);

    if (flags.rawExternal) return;

    const label = String(labelCtrl.field.value ?? "").trim();
    if (!label) return;

    if (hrefCtrl.fieldState.isTouched) return;

    const currentHref = hrefNow.trim();
    // New child rows start with `/`; keep it editable until the label can produce a better internal slug.
    const isEmptyInternalDraft = currentHref === "" || currentHref === "/";

    if (!isEmptyInternalDraft) return;

    const slug = slugifyPath(label);
    if (!slug) return;

    hrefCtrl.field.onChange(`/${slug}`);
    void trigger(`items.${pIdx}.children.${cIdx}.href` as const);
  };

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-60")}
    >
      <MenuFieldsItem
        idPrefix={childIdPrefix}
        disabled={disabled}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        internalPageOptions={internalPageOptions}
        onRemove={onRemove}
        hasChildren={false}
        labelField={
          {
            ...labelCtrl.field,
            onBlur: handleLabelBlur,
          } as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.children.${number}.label`
          >
        }
        hrefField={
          hrefCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.children.${number}.href`
          >
        }
        newTabField={
          newTabCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.children.${number}.newTab`
          >
        }
        invalid={invalid}
        error={error}
        onHrefValidateNow={validateHrefNow}
      />
      <Separator aria-hidden="true" />
    </li>
  );
}
