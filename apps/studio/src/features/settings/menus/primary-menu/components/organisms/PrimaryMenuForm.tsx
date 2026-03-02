"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/organisms/PrimaryMenuForm.tsx
 * @layer ui/organisms
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
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { FieldErrors } from "react-hook-form";
import {
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { useStableOnValuesChange } from "@compoz/ui/hooks/useStableOnValuesChange";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type {
  PrimaryMenuChildFormValues,
  PrimaryMenuFormValues,
  PrimaryMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import { PrimaryMenuFormSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { PrimaryMenuChildRow } from "@compoz/studio/features/settings/menus/primary-menu/components/molecules/PrimaryMenuChildRow";
import { PrimaryMenuParentRow } from "@compoz/studio/features/settings/menus/primary-menu/components/molecules/PrimaryMenuParentRow";
import {
  usePrimaryMenuUiWarnings,
  type PrimaryMenuWarningKey,
} from "@compoz/studio/features/settings/menus/primary-menu/validate";
import { notify } from "@compoz/studio/lib/ui/notify";

// Types (UI) : props + erreurs/invalid locaux.
type PrimaryMenuFormProps = Readonly<{
  /** Valeurs initiales (baseline) fournies par la section. */
  initialValues: PrimaryMenuFormValues;

  /** Indique qu’une sauvegarde côté parent est en cours. */
  isSaving?: boolean;

  /** Callback appelé avec des valeurs validées par Zod (`PrimaryMenuFormSchema`). */
  onSubmit: (values: PrimaryMenuFormValues) => void | Promise<void>;

  /** Handler optionnel : permet au parent de réagir à un reset UI. */
  onReset?: () => void;

  /** Options de pages internes disponibles (picker). */
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;

  /** Ensemble des href internes connus (warnings). */
  hrefSet: ReadonlySet<string>;

  /** Handler optionnel : remonte les warnings UI (non bloquants). */
  onWarningKeysChange?: (keys: PrimaryMenuWarningKey[]) => void;

  /** Handler optionnel : remonte les valeurs live (preview draft). */
  onValuesChange?: (values: PrimaryMenuFormValues) => void;

  onBlockingErrorsCountChange?: (count: number) => void;

  /** Handler optionnel : remonte l’état dirty (guard / navigation). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

/**
 * Formulaire de configuration du menu principal (admin).
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
    reset: rhfReset,
    setValue,
    getValues,
    getFieldState,
    trigger,
    setFocus,
  } = useForm<PrimaryMenuFormValues>({
    resolver: zodResolver(PrimaryMenuFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const { isDirty, isSubmitting, submitCount, isSubmitted } = useFormState({
    control,
  });

  const itemsState = useFormState({ control, name: "items" });

  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  const t = useTranslations();

  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const isBusy = Boolean(isSaving || isSubmitting);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const formIdPrefix = useIdPrefix("primary-menu-form");

  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  const watched = useWatch({ control }) as PrimaryMenuFormValues | undefined;
  const values = watched ?? initialValues;

  // Preview draft (valeurs live) — remonte le modèle UI.
  useStableOnValuesChange(values, onValuesChange);

  const warningKeys = usePrimaryMenuUiWarnings(values.items ?? [], hrefSet);

  // Anti-spam : évite de renvoyer des warnings identiques.
  const lastWarningsSigRef = useRef<string>("");

  useEffect(() => {
    if (!onWarningKeysChange) return;

    const sig = warningKeys.join("|");
    if (sig === lastWarningsSigRef.current) return;

    lastWarningsSigRef.current = sig;
    onWarningKeysChange(warningKeys);
  }, [warningKeys, onWarningKeysChange]);

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

  // ✅ Même logique que Legal/Primary : une fois qu’on a submit, on affiche les invalids globalement.
  const showError = hasSubmittedOnce || isSubmitted || submitCount > 0;

  /**
   * ✅ Compteur d'erreurs bloquantes (badge).
   * On ne lit PAS `errors.items[idx]`/`touchedFields.items[idx]` (tableaux “sparse”).
   * On passe par `getFieldState`, qui est la source fiable RHF.
   *
   * @remarks
   * On compte uniquement les champs effectivement “invalid” côté UX :
   * - si `showError` OU si le champ est touché
   * - et si une erreur existe.
   */
  const blockingErrorsCount = useMemo(() => {
    const items = values.items ?? [];
    let count = 0;

    for (let pIdx = 0; pIdx < items.length; pIdx++) {
      // Parent label/href
      const pLabel = getFieldState(`items.${pIdx}.label` as const, itemsState);
      const pHref = getFieldState(`items.${pIdx}.href` as const, itemsState);

      const pLabelInvalid =
        (showError || pLabel.isTouched) && Boolean(pLabel.error);
      const pHrefInvalid =
        (showError || pHref.isTouched) && Boolean(pHref.error);

      if (pLabelInvalid) count++;
      if (pHrefInvalid) count++;

      // Children label/href
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
    // deps importantes :
    // - values.items : structure (nb items/enfants)
    // - itemsState : rerender quand erreurs/touched sous "items" changent
    // - showError : la bascule UX (submit -> show all)
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

    const el = document.getElementById(targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    setTimeout(() => {
      (el as HTMLElement).focus?.();
    }, 50);
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
            <EmptyState text={t("admin.primaryMenuForm.empty.primary")} />
          ) : (
            fields.map((field, pIdx) => {
              const parentIdPrefix = `${formIdPrefix}-parent-${pIdx}`;

              const parent = (values.items?.[pIdx] ??
                {}) as PrimaryMenuItemFormValues;
              const children = parent.children ?? [];

              const renderChildren = (
                <ul className={cn(STACK_MD)}>
                  {children.map((_, cIdx) => {
                    const childIdPrefix = `${formIdPrefix}-child-${pIdx}-${cIdx}`;

                    return (
                      <PrimaryMenuChildRow
                        key={toStableUiKey(
                          { keyId: `pm-child-${pIdx}-${cIdx}` },
                          cIdx,
                        )}
                        pIdx={pIdx}
                        cIdx={cIdx}
                        control={control}
                        trigger={trigger}
                        disabled={isBusy}
                        showError={showError}
                        childIdPrefix={childIdPrefix}
                        internalPageOptions={internalPageOptions}
                        isFirst={cIdx === 0}
                        isLast={cIdx === children.length - 1}
                        onRemove={() => {
                          const next = [...children];
                          next.splice(cIdx, 1);
                          setChildren(pIdx, next);
                          void trigger(`items.${pIdx}.children` as const);
                        }}
                        onMoveUp={() => {
                          if (cIdx <= 0) return;
                          const next = [...children];
                          const [moved] = next.splice(cIdx, 1);
                          next.splice(cIdx - 1, 0, moved);
                          setChildren(pIdx, next);
                        }}
                        onMoveDown={() => {
                          if (cIdx >= children.length - 1) return;
                          const next = [...children];
                          const [moved] = next.splice(cIdx, 1);
                          next.splice(cIdx + 1, 0, moved);
                          setChildren(pIdx, next);
                        }}
                      />
                    );
                  })}
                </ul>
              );

              return (
                <Fragment key={field.id}>
                  <div>
                    <PrimaryMenuParentRow
                      pIdx={pIdx}
                      control={control}
                      trigger={trigger}
                      disabled={isBusy}
                      showError={showError}
                      parentIdPrefix={parentIdPrefix}
                      internalPageOptions={internalPageOptions}
                      isFirst={pIdx === 0}
                      isLast={pIdx === fields.length - 1}
                      onRemove={() => remove(pIdx)}
                      onMoveUp={() => move(pIdx, Math.max(0, pIdx - 1))}
                      onMoveDown={() =>
                        move(pIdx, Math.min(fields.length - 1, pIdx + 1))
                      }
                      onAddChild={() => {
                        const nextChildIndex = children.length;

                        const nextChild = createEmptyChild();
                        const nextChildren = [...children, nextChild];
                        setChildren(pIdx, nextChildren);

                        // Force `newTab=false` sur le parent dès qu’il a des enfants.
                        enforceParentRulesIfHasChildren(pIdx);

                        // garder le comportement existant : validation href parent
                        void trigger(`items.${pIdx}.href` as const);

                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            setFocus(
                              `items.${pIdx}.children.${nextChildIndex}.label` as const,
                            );
                          });
                        });
                      }}
                      renderChildren={renderChildren}
                      childrenCount={children.length}
                    />
                  </div>
                  {pIdx < fields.length - 1 ? <Separator /> : null}
                </Fragment>
              );
            })
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
              rhfReset(initialValues, {
                keepDirty: false,
                keepTouched: false,
                keepErrors: false,
              });
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
