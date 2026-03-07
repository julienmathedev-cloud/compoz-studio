"use client";

/**
 * @file apps/studio/src/features/settings/legal-menu/components/organisms/LegalMenuForm.tsx
 * @layer ui/studio/organisms
 * @description
 * Formulaire d’édition du menu légal (studio) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Les items sont gérés via `useFieldArray` et une row dédiée (obligatoire pour `useController`).
 * - Les erreurs bloquantes sont affichées au plus près des champs (au niveau row).
 * - Le focus/scroll sur la première erreur au submit est géré localement.
 */

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useState } from "react";
import type { FieldErrors } from "react-hook-form";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { focusFirstArrayFieldError } from "@compoz/studio/features/settings/_shared/focusFirstArrayFieldError";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import { LegalMenuItemRow } from "@compoz/studio/features/settings/menus/legal-menu/components/molecules/LegalMenuItemRow";
import type { LegalMenuWarningKey } from "@compoz/studio/features/settings/menus/legal-menu/validate";
import { useLegalMenuUiWarnings } from "@compoz/studio/features/settings/menus/legal-menu/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type {
  LegalMenuFormValues,
  LegalMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import { LegalMenuFormSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";

/**
 * Compte le nombre d’erreurs “leaf” dans un objet `errors` RHF.
 *
 * @remarks
 * - Une leaf est un objet contenant une propriété `message` (erreur RHF).
 * - Les arrays / objets sont parcourus récursivement.
 * - Couvre naturellement : structures imbriquées + field arrays.
 */
function countBlockingErrors(value: unknown): number {
  if (!value) return 0;

  if (Array.isArray(value)) {
    return value.reduce((acc, v) => acc + countBlockingErrors(v), 0);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return 1;
    }

    let total = 0;

    for (const key of Object.keys(obj)) {
      total += countBlockingErrors(obj[key]);
    }

    return total;
  }

  return 0;
}

/**
 * Props du composant `LegalMenuForm`.
 */
type LegalMenuFormProps = Readonly<{
  initialValues: LegalMenuFormValues;
  isSaving?: boolean;
  onSubmit: (values: LegalMenuFormValues) => void | Promise<void>;
  onReset?: () => void;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  hrefSet: ReadonlySet<string>;
  onWarningKeysChange?: (keys: LegalMenuWarningKey[]) => void;
  onValuesChange?: (values: LegalMenuFormValues) => void;
  onBlockingErrorsCountChange?: (count: number) => void;
  onDirtyChange?: (dirty: boolean) => void;
}>;

/**
 * Formulaire de configuration du menu légal (studio).
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
    trigger,
    resetToInitialValues,
    isDirty,
    isSubmitting,
    isBusy,
    submitCount,
    isSubmitted,
  } = useSettingsSectionForm<LegalMenuFormValues>({
    resolver: zodResolver(LegalMenuFormSchema),
    initialValues,
    isSaving,
    onValuesChange,
    onDirtyChange,
  });

  const t = useTranslations();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const itemsState = useFormState({ control, name: "items" });
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  const formIdPrefix = useIdPrefix("legal-menu-form");

  const watched = useWatch({ control }) as LegalMenuFormValues | undefined;
  const values = watched ?? initialValues;

  const warningKeys = useLegalMenuUiWarnings(values.items ?? [], hrefSet);

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  const showError = hasSubmittedOnce || isSubmitted || submitCount > 0;
  const blockingErrorsCount = countBlockingErrors(itemsState.errors);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  function createEmptyItem(): LegalMenuItemFormValues {
    return {
      label: "",
      href: "/",
      newTab: false,
    };
  }

  function handleSubmitErrors(formErrors: FieldErrors<LegalMenuFormValues>) {
    setHasSubmittedOnce(true);
    notify.error(t("uiErrors.formHasErrors"));

    focusFirstArrayFieldError<"label" | "href">({
      itemErrors: formErrors.items,
      fieldPriority: ["label", "href"],
      getFieldId: (index, field) => {
        const rowIdPrefix = `${formIdPrefix}-item-${index}`;

        if (field === "label") {
          return createFieldIds(rowIdPrefix, "label").fieldId;
        }

        return createFieldIds(`${rowIdPrefix}-link`, "href").fieldId;
      },
    });
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
            <EmptyState text={t("studio.legalMenuForm.empty")} />
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

LegalMenuForm.displayName = "LegalMenuForm";
