"use client";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
/**
 * @file apps/studio/src/features/settings/legal-menu/components/organisms/LegalMenuForm.tsx
 * @layer ui/organisms
 *
 * @description
 * Formulaire d’édition du menu légal (admin) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Les items sont gérés via `useFieldArray` et une row dédiée (obligatoire pour `useController`).
 * - Les erreurs bloquantes sont affichées au plus près des champs (au niveau row).
 * - Le focus/scroll sur la première erreur au submit est géré localement.
 */

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { useStableOnValuesChange } from "@compoz/ui/hooks/useStableOnValuesChange";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type {
  LegalMenuFormValues,
  LegalMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import { LegalMenuFormSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { LegalMenuItemRow } from "@compoz/studio/features/settings/menus/legal-menu/components/molecules/LegalMenuItemRow";
import type { LegalMenuWarningKey } from "@compoz/studio/features/settings/menus/legal-menu/validate";
import { useLegalMenuUiWarnings } from "@compoz/studio/features/settings/menus/legal-menu/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useRef, useState } from "react";
import type { FieldErrors } from "react-hook-form";
import {
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";

/**
 * Compte le nombre d’erreurs “leaf” dans un objet `errors` RHF.
 *
 * @remarks
 * - Une leaf est un objet contenant une propriété `message` (erreur RHF).
 * - Les arrays/objets sont parcourus récursivement.
 * - Couvre naturellement : structures imbriquées + field arrays.
 */
function countBlockingErrors(value: unknown): number {
  if (!value) return 0;

  if (Array.isArray(value)) {
    return value.reduce((acc, v) => acc + countBlockingErrors(v), 0);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // “Leaf” RHF typique : { type, message, ref }
    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return 1;
    }

    let total = 0;
    for (const k of Object.keys(obj)) {
      total += countBlockingErrors(obj[k]);
    }
    return total;
  }

  return 0;
}

/**
 * Props du composant `LegalMenuForm`.
 */
type LegalMenuFormProps = Readonly<{
  /** Valeurs initiales (baseline) fournies par la section. */
  initialValues: LegalMenuFormValues;
  /** Indique qu’une sauvegarde côté parent est en cours. */
  isSaving?: boolean;
  /** Callback appelé avec des valeurs validées par Zod (`LegalMenuFormSchema`). */
  onSubmit: (values: LegalMenuFormValues) => void | Promise<void>;
  /** Handler optionnel : permet au parent de réagir à un reset UI. */
  onReset?: () => void;
  /** Options de pages internes disponibles (picker). */
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  /** Ensemble des href internes connus (warnings). */
  hrefSet: ReadonlySet<string>;
  /** Handler optionnel : remonte les warnings UI (non bloquants). */
  onWarningKeysChange?: (keys: LegalMenuWarningKey[]) => void;
  /** Handler optionnel : remonte les valeurs live (preview draft). */
  onValuesChange?: (values: LegalMenuFormValues) => void;

  /** Handler optionnel : remonte le nombre d’erreurs bloquantes (badge). */
  onBlockingErrorsCountChange?: (count: number) => void;

  /** Handler optionnel : remonte l’état dirty (guard / navigation). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

/**
 * Formulaire de configuration du menu légal (admin).
 */
export function LegalMenuForm({
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
}: LegalMenuFormProps) {
  const {
    control,
    handleSubmit,
    reset: rhfReset,
    trigger,
  } = useForm<LegalMenuFormValues>({
    resolver: zodResolver(LegalMenuFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false, // on gère le focus nous-mêmes comme Identity
  });

  // ✅ Important : s’abonner à l’état global utile pour rerender (dirty/submitting/submitCount)
  // + l’état des items (errors/touched) de manière fiable.
  const { isDirty, isSubmitting, submitCount, isSubmitted } = useFormState({
    control,
  });

  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  // Le chargement initial est géré par la section.
  const isBusy = Boolean(isSaving || isSubmitting);

  // Sous-état RHF pour les items (errors/touched/etc).
  const itemsState = useFormState({ control, name: "items" });

  const t = useTranslations();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  // Préfixe d’ID stable pour ce formulaire (base des IDs de rows).
  const formIdPrefix = useIdPrefix("legal-menu-form");

  // Resynchronisation RHF lorsque `initialValues` change (reload côté section).
  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  // Dirty signal vers le parent (guard / navigation).
  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  // Valeurs RHF live (warnings + preview draft).
  const watched = useWatch({ control }) as LegalMenuFormValues | undefined;
  const values = watched ?? initialValues;

  // Preview draft (valeurs live) — remonte le modèle UI.
  useStableOnValuesChange(values, onValuesChange);

  // Warnings UI (non bloquants).
  const warningKeys = useLegalMenuUiWarnings(values.items ?? [], hrefSet);

  // Anti-spam : évite de renvoyer des warnings identiques.
  const lastWarningsSigRef = useRef<string>("");

  useEffect(() => {
    if (!onWarningKeysChange) return;
    const sig = warningKeys.join("|");
    if (sig === lastWarningsSigRef.current) return;
    lastWarningsSigRef.current = sig;
    onWarningKeysChange(warningKeys);
  }, [warningKeys, onWarningKeysChange]);

  // Fabrique un nouvel item vide pour “Ajouter un lien”.
  const createEmptyItem = (): LegalMenuItemFormValues => ({
    label: "",
    href: "/",
    newTab: false,
  });

  // ✅ même logique que PrimaryMenu : une fois qu’on a submit, on affiche les invalids globalement
  const showError = hasSubmittedOnce || isSubmitted || submitCount > 0;

  /**
   * ✅ Compteur d'erreurs bloquantes (badge).
   *
   * PATCH: harmonisation — on compte depuis `formState.errors` (ici `itemsState.errors`)
   * plutôt que de recalculer via `getFieldState`/touched.
   *
   * @remarks
   * - Les erreurs n’existent que si RHF/Zod a réellement validé (onBlur / trigger / submit).
   * - Compatible field arrays (même si “sparse”) grâce au parcours récursif.
   */
  const blockingErrorsCount = countBlockingErrors(itemsState.errors);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  function handleSubmitErrors(formErrors: FieldErrors<LegalMenuFormValues>) {
    setHasSubmittedOnce(true);
    notify.error(t("uiErrors.formHasErrors"));

    // 1) On cible le premier index d’item qui a une erreur (label/href)
    const itemErrors = formErrors.items;
    if (!Array.isArray(itemErrors) || itemErrors.length === 0) return;

    const firstIndex = itemErrors.findIndex((e) => !!e?.label || !!e?.href);
    if (firstIndex < 0) return;

    // 2) Priorité champ : label puis href
    const fieldPriority: Array<"label" | "href"> = ["label", "href"];
    const firstField = fieldPriority.find((k) => !!itemErrors[firstIndex]?.[k]);
    if (!firstField) return;

    // 3) Reconstitue l’ID exact du champ (aligné avec MenuFieldsItem)
    const rowIdPrefix = `${formIdPrefix}-item-${firstIndex}`;
    const linkIdPrefix = `${rowIdPrefix}-link`;

    const targetId =
      firstField === "label"
        ? createFieldIds(rowIdPrefix, "label").fieldId
        : createFieldIds(linkIdPrefix, "href").fieldId;

    const el = document.getElementById(targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    setTimeout(() => {
      (el as HTMLElement).focus?.();
    }, 50);
  }

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit((validValues) => {
        setHasSubmittedOnce(false);
        return onSubmit(validValues);
      }, handleSubmitErrors)}
      noValidate
    >
      <Card variant="panel">
        <CardContent className={cn(STACK_MD)}>
          {fields.length === 0 ? (
            <EmptyState text={t("admin.legalMenuForm.empty")} />
          ) : (
            fields.map((field, index) => {
              const rowIdPrefix = `${formIdPrefix}-item-${index}`;

              return (
                <Fragment key={field.id}>
                  <div>
                    <LegalMenuItemRow
                      index={index}
                      control={control}
                      trigger={trigger}
                      disabled={isBusy}
                      showError={showError}
                      rowIdPrefix={rowIdPrefix}
                      internalPageOptions={internalPageOptions}
                      isFirst={index === 0}
                      isLast={index === fields.length - 1}
                      onRemove={() => remove(index)}
                      onMoveUp={() => move(index, Math.max(0, index - 1))}
                      onMoveDown={() =>
                        move(index, Math.min(fields.length - 1, index + 1))
                      }
                    />
                  </div>
                  {index < fields.length - 1 ? <Separator /> : null}
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
            onAdd={() => append(createEmptyItem())}
            onReset={() => {
              // Reset UI immédiat (RHF).
              rhfReset(initialValues, {
                keepDirty: false,
                keepTouched: false,
                keepErrors: false,
              });
              // Puis notification côté parent (si besoin).
              onReset?.();
            }}
            addLabel={t("common.addLink")}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

LegalMenuForm.displayName = "LegalMenuForm";
