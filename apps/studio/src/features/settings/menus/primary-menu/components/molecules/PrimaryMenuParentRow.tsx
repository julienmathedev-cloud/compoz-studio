"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/molecules/PrimaryMenuParentRow.tsx
 * @layer studio/features/settings/menus/primary-menu/components/molecules
 *
 * @description
 * RHF-connected sortable row for editing one parent item in the primary menu.
 *
 * @remarks
 * - Keeps `useController` inside the row so each sortable parent owns its field subscriptions.
 * - Auto-fills an internal href from the label only for leaf parents while the href field is still an untouched draft.
 * - Child rows are rendered by the parent form to keep nested field-array ordering controlled in one place.
 */

import { useSortable } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type {
  Control,
  ControllerRenderProps,
  UseFormTrigger,
} from "react-hook-form";
import { useController, useWatch } from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { MenuFieldsItem } from "@compoz/studio/features/settings/menus/_shared/MenuFieldsItem";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { resolveLinkFlags, slugifyPath } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";

type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

type ParentRowProps = Readonly<{
  sortableId: string;
  pIdx: number;
  control: Control<PrimaryMenuFormValues>;
  trigger: UseFormTrigger<PrimaryMenuFormValues>;
  disabled: boolean;
  showError: boolean;
  parentIdPrefix: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  onRemove: () => void;

  onAddChild: () => void;

  renderChildren: ReactNode;

  childrenCount: number;

  /** Collapses child content during parent-level sorting to avoid nested DnD collisions. */
  isSortingParents: boolean;
}>;

export function PrimaryMenuParentRow({
  sortableId,
  pIdx,
  control,
  trigger,
  disabled,
  showError,
  parentIdPrefix,
  internalPageOptions,
  onRemove,
  onAddChild,
  renderChildren,
  childrenCount,
  isSortingParents,
}: ParentRowProps) {
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
    name: `items.${pIdx}.label` as const,
    control,
  });

  const hrefCtrl = useController({
    name: `items.${pIdx}.href` as const,
    control,
  });

  const newTabCtrl = useController({
    name: `items.${pIdx}.newTab` as const,
    control,
  });

  const children =
    useWatch({
      control,
      name: `items.${pIdx}.children` as const,
    }) ?? [];

  const hasChildren = children.length > 0;

  const t = useTranslations();

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

    void trigger(`items.${pIdx}.href` as const);
  };

  /** Auto-fills draft internal links from the label without overwriting user-edited hrefs. */
  const handleLabelBlur = () => {
    labelCtrl.field.onBlur();

    // Parents with children act as groups; their href must remain explicitly chosen.
    if (hasChildren) return;

    const hrefNow = String(hrefCtrl.field.value ?? "");
    const flags = resolveLinkFlags(hrefNow);
    if (flags.rawExternal) return;

    const label = String(labelCtrl.field.value ?? "").trim();
    if (!label) return;

    if (hrefCtrl.fieldState.isTouched) return;

    const currentHref = hrefNow.trim();
    // New parent rows start with `/`; keep it editable until the label can produce a better internal slug.
    const isEmptyInternalDraft = currentHref === "" || currentHref === "/";

    if (!isEmptyInternalDraft) return;

    const slug = slugifyPath(label);
    if (!slug) return;

    hrefCtrl.field.onChange(`/${slug}`);
    void trigger(`items.${pIdx}.href` as const);
  };

  const addChildDisabled = Boolean(disabled || isSortingParents);

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
        idPrefix={parentIdPrefix}
        disabled={disabled}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        internalPageOptions={internalPageOptions}
        onRemove={onRemove}
        hasChildren={hasChildren}
        labelField={
          {
            ...labelCtrl.field,
            onBlur: handleLabelBlur,
          } as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.label`
          >
        }
        hrefField={
          hrefCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.href`
          >
        }
        newTabField={
          newTabCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.newTab`
          >
        }
        invalid={invalid}
        error={error}
        onHrefValidateNow={validateHrefNow}
      />

      <ExpandableLayout
        id={`${parentIdPrefix}-children`}
        label={
          childrenCount > 0
            ? t("studio.primaryMenuForm.children.labelWithCount", {
                count: childrenCount,
              })
            : t("studio.primaryMenuForm.children.label")
        }
        disabled={disabled}
        forceClosed={isSortingParents}
      >
        <div className="m-2">
          {childrenCount === 0 ? (
            <AddEmptyCardButton
              onClick={onAddChild}
              disabled={addChildDisabled}
              ariaLabel={t("common.addSubLink")}
              tooltip={t("common.addSubLink")}
              disabledTooltip={t(
                "studio.primaryMenuForm.children.tooltips.unavailableWhileBusy",
              )}
              compact
            />
          ) : (
            <Card
              variant="panel"
              visualMode="studio"
              className="bg-secondary/10 shadow-xs shadow-accent"
            >
              <CardContent className="flex flex-col gap-2">
                {renderChildren}

                <Separator />

                <AddEmptyCardButton
                  onClick={onAddChild}
                  disabled={addChildDisabled}
                  ariaLabel={t("common.addSubLink")}
                  tooltip={t("common.addSubLink")}
                  disabledTooltip={t(
                    "studio.primaryMenuForm.children.tooltips.unavailableWhileBusy",
                  )}
                  compact
                />
              </CardContent>
            </Card>
          )}
        </div>
      </ExpandableLayout>
    </div>
  );
}

PrimaryMenuParentRow.displayName = "PrimaryMenuParentRow";
