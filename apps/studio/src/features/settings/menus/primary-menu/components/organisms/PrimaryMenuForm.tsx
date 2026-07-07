"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/organisms/PrimaryMenuForm.tsx
 * @layer studio/features/settings/menus/primary-menu/components/organisms
 *
 * @description
 * RHF and Zod-backed studio form for editing the primary menu and its child links.
 *
 * @remarks
 * - Uses `useFieldArray` with dedicated parent and child rows so sortable items can own their controllers.
 * - Reports UI warnings, blocking error count, value changes, and dirty state to the parent section.
 * - Focuses the first row-level blocking error after a failed submit.
 */

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FieldErrors } from "react-hook-form";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import { PrimaryMenuItemBlock } from "@compoz/studio/features/settings/menus/primary-menu/components/organisms/PrimaryMenuItemBlock";
import {
  usePrimaryMenuUiWarnings,
  type PrimaryMenuWarningKey,
} from "@compoz/studio/features/settings/menus/primary-menu/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { focusByFieldId } from "@compoz/ui/lib/focus";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type {
  PrimaryMenuChildFormValues,
  PrimaryMenuFormValues,
  PrimaryMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import { PrimaryMenuFormSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";

type PrimaryMenuFormProps = Readonly<{
  initialValues: PrimaryMenuFormValues;
  isSaving?: boolean;
  onSubmit: (values: PrimaryMenuFormValues) => void | Promise<void>;
  onReset?: () => void;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  hrefSet: ReadonlySet<string>;
  onWarningKeysChange?: (keys: PrimaryMenuWarningKey[]) => void;
  onValuesChange?: (values: PrimaryMenuFormValues) => void;
  onBlockingErrorsCountChange?: (count: number) => void;
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function PrimaryMenuForm({
  initialValues,
  isSaving,
  onSubmit,
  onReset,
  internalPageOptions,
  hrefSet,
  onWarningKeysChange,
  onValuesChange,
  onBlockingErrorsCountChange,
  onDirtyChange,
}: PrimaryMenuFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    getFieldState,
    trigger,
    setFocus,
    resetToInitialValues,
    isDirty,
    isSubmitting,
    isBusy,
    submitCount,
    isSubmitted,
  } = useSettingsSectionForm<PrimaryMenuFormValues>({
    resolver: zodResolver(PrimaryMenuFormSchema),
    initialValues,
    isSaving,
    onValuesChange,
    onDirtyChange,
  });

  const itemsState = useFormState({ control, name: "items" });

  const t = useTranslations();
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  /** Collapses child lists while parent items are being sorted to avoid nested DnD collisions. */
  const [isSortingParents, setIsSortingParents] = useState(false);

  const { fields, append, remove, move } = useFieldArray<
    PrimaryMenuFormValues,
    "items",
    "fieldId"
  >({
    control,
    name: "items",
    keyName: "fieldId",
  });

  const formIdPrefix = useIdPrefix("primary-menu-form");

  const watched = useWatch({ control }) as PrimaryMenuFormValues | undefined;
  const values = watched ?? initialValues;

  const warningKeys = usePrimaryMenuUiWarnings(values.items ?? [], hrefSet);

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  const createEmptyParent = (): PrimaryMenuItemFormValues => ({
    id: crypto.randomUUID(),
    label: "",
    href: "/",
    newTab: false,
    children: [],
  });

  const createEmptyChild = (): PrimaryMenuChildFormValues => ({
    id: crypto.randomUUID(),
    label: "",
    href: "/",
    newTab: false,
  });

  const showError = hasSubmittedOnce || isSubmitted || submitCount > 0;

  const blockingErrorsCount = useMemo(() => {
    const items = values.items ?? [];
    let count = 0;

    for (let pIdx = 0; pIdx < items.length; pIdx++) {
      const pLabel = getFieldState(`items.${pIdx}.label` as const, itemsState);
      const pHref = getFieldState(`items.${pIdx}.href` as const, itemsState);

      const pLabelInvalid =
        (showError || pLabel.isTouched) && Boolean(pLabel.error);
      const pHrefInvalid =
        (showError || pHref.isTouched) && Boolean(pHref.error);

      if (pLabelInvalid) count++;
      if (pHrefInvalid) count++;

      const children = items[pIdx]?.children ?? [];
      for (let cIdx = 0; cIdx < children.length; cIdx++) {
        const cLabel = getFieldState(
          `items.${pIdx}.children.${cIdx}.label` as const,
          itemsState,
        );
        const cHref = getFieldState(
          `items.${pIdx}.children.${cIdx}.href` as const,
          itemsState,
        );

        const cLabelInvalid =
          (showError || cLabel.isTouched) && Boolean(cLabel.error);
        const cHrefInvalid =
          (showError || cHref.isTouched) && Boolean(cHref.error);

        if (cLabelInvalid) count++;
        if (cHrefInvalid) count++;
      }
    }

    return count;
  }, [values.items, itemsState, getFieldState, showError]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  const setChildren = useCallback(
    (pIdx: number, nextChildren: PrimaryMenuChildFormValues[]) => {
      setValue(`items.${pIdx}.children`, nextChildren, {
        shouldDirty: true,
        shouldTouch: false,
      });
    },
    [setValue],
  );

  /** Parent items with children behave as groups and must not open in a new tab. */
  const enforceParentRulesIfHasChildren = useCallback(
    (pIdx: number) => {
      const parent = getValues(`items.${pIdx}`) as
        | PrimaryMenuItemFormValues
        | undefined;
      if (!parent) return;

      const hasChildren = (parent.children?.length ?? 0) > 0;
      if (!hasChildren) return;

      setValue(`items.${pIdx}.newTab`, false, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [getValues, setValue],
  );

  const handleSubmitErrors = (
    formErrors: FieldErrors<PrimaryMenuFormValues>,
  ) => {
    setHasSubmittedOnce(true);
    notify.error(t("uiErrors.formHasErrors"));

    const itemsErr = formErrors.items;
    if (!Array.isArray(itemsErr) || itemsErr.length === 0) return;

    let target:
      | { kind: "parent"; pIdx: number; field: "label" | "href" }
      | {
          kind: "child";
          pIdx: number;
          cIdx: number;
          field: "label" | "href";
        }
      | null = null;

    for (let pIdx = 0; pIdx < itemsErr.length; pIdx++) {
      const pErr = itemsErr[pIdx];
      if (!pErr) continue;

      if (pErr.label) {
        target = { kind: "parent", pIdx, field: "label" };
        break;
      }
      if (pErr.href) {
        target = { kind: "parent", pIdx, field: "href" };
        break;
      }

      const cErrs = pErr.children;
      if (Array.isArray(cErrs)) {
        for (let cIdx = 0; cIdx < cErrs.length; cIdx++) {
          const cErr = cErrs[cIdx];
          if (!cErr) continue;

          if (cErr.label) {
            target = { kind: "child", pIdx, cIdx, field: "label" };
            break;
          }
          if (cErr.href) {
            target = { kind: "child", pIdx, cIdx, field: "href" };
            break;
          }
        }
      }

      if (target) break;
    }

    if (!target) return;

    const idPrefix =
      target.kind === "parent"
        ? `${formIdPrefix}-parent-${target.pIdx}`
        : `${formIdPrefix}-child-${target.pIdx}-${target.cIdx}`;

    const targetId =
      target.field === "label"
        ? createFieldIds(idPrefix, "label").fieldId
        : createFieldIds(`${idPrefix}-link`, "href").fieldId;

    focusByFieldId(targetId);
  };

  const handleParentDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setIsSortingParents(false);

      if (!over || active.id === over.id) return;
      if (isBusy) return;

      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      move(oldIndex, newIndex);

      // Revalidate the field array after reordering so RHF errors stay aligned with row indexes.
      await trigger("items");
    },
    [fields, isBusy, move, trigger],
  );

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(async (validValues) => {
        setHasSubmittedOnce(false);
        return onSubmit(validValues);
      }, handleSubmitErrors)}
      noValidate
    >
      <Card variant="panel" visualMode="studio">
        <CardContent className={cn(STACK_SM)}>
          {fields.length === 0 ? (
            <EmptyState text={t("studio.primaryMenuForm.empty.primary")} />
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={() => {
                setIsSortingParents(true);
              }}
              onDragCancel={() => {
                setIsSortingParents(false);
              }}
              onDragEnd={handleParentDragEnd}
            >
              <SortableContext
                items={fields.map((field) => field.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field, pIdx) => (
                  <PrimaryMenuItemBlock
                    key={field.fieldId}
                    sortableId={field.id}
                    pIdx={pIdx}
                    totalParents={fields.length}
                    control={control}
                    trigger={trigger}
                    setFocus={setFocus}
                    disabled={isBusy}
                    showError={showError}
                    formIdPrefix={formIdPrefix}
                    internalPageOptions={internalPageOptions}
                    parent={
                      (values.items?.[pIdx] ?? {}) as PrimaryMenuItemFormValues
                    }
                    onRemoveParent={() => remove(pIdx)}
                    setChildren={setChildren}
                    createEmptyChild={createEmptyChild}
                    enforceParentRulesIfHasChildren={
                      enforceParentRulesIfHasChildren
                    }
                    isSortingParents={isSortingParents}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>

        <CardFooter>
          <ActionsBar
            variant="addResetSubmit"
            isSaving={isSaving || isSubmitting}
            isDirty={isDirty}
            onAdd={() => {
              const nextIndex = fields.length;
              append(createEmptyParent());
              requestAnimationFrame(() => {
                setFocus(`items.${nextIndex}.label` as const);
              });
            }}
            onReset={() => {
              resetToInitialValues();
              onReset?.();
            }}
            addLabel={t("common.addLink")}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

PrimaryMenuForm.displayName = "PrimaryMenuForm";
