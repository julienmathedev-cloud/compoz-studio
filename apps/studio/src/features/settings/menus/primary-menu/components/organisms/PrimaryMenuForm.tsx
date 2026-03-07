"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/organisms/PrimaryMenuForm.tsx
 * @layer ui/studio/organisms
 *
 * @description
 * Formulaire d’édition du menu principal (parents + sous-liens) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Les items (parents/enfants) sont gérés via `useFieldArray` et des rows dédiées (obligatoire pour `useController`).
 * - Les erreurs bloquantes sont affichées au plus près des champs (au niveau row).
 * - UX : focus/scroll sur le premier champ invalide au submit (IDs stables, sans ref).
 * - Option “derive external” : le mode interne/externe est dérivé depuis `href` côté UI.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
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
import { focusByFieldId } from "@compoz/ui/lib/focus";
import { notify } from "@compoz/studio/lib/ui/notify";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
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

/**
 * Formulaire de configuration du menu principal (studio).
 */
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

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
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
    label: "",
    href: "/",
    newTab: false,
    children: [],
  });

  const createEmptyChild = (): PrimaryMenuChildFormValues => ({
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

  const setChildren = (
    pIdx: number,
    nextChildren: PrimaryMenuChildFormValues[],
  ) => {
    setValue(`items.${pIdx}.children`, nextChildren, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  /**
   * Parent avec enfants : force `newTab=false` (cohérence nav).
   */
  const enforceParentRulesIfHasChildren = (pIdx: number) => {
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
  };

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

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(async (validValues) => {
        setHasSubmittedOnce(false);
        return onSubmit(validValues);
      }, handleSubmitErrors)}
      noValidate
    >
      <Card variant="panel">
        <CardContent className={cn(STACK_SM)}>
          {fields.length === 0 ? (
            <EmptyState text={t("studio.primaryMenuForm.empty.primary")} />
          ) : (
            fields.map((field, pIdx) => (
              <PrimaryMenuItemBlock
                key={field.id}
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
                onMoveParentUp={() => move(pIdx, Math.max(0, pIdx - 1))}
                onMoveParentDown={() =>
                  move(pIdx, Math.min(fields.length - 1, pIdx + 1))
                }
                setChildren={setChildren}
                createEmptyChild={createEmptyChild}
                enforceParentRulesIfHasChildren={
                  enforceParentRulesIfHasChildren
                }
              />
            ))
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
