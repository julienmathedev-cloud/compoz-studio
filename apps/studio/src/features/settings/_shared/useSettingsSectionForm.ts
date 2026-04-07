"use client";

/**
 * @file apps/studio/src/features/settings/_shared/useSettingsSectionForm.ts
 * @layer hooks/studio/site/settings/shared
 *
 * @description
 * Hook commun pour la base RHF d’une section settings Studio.
 *
 * @remarks
 * - Centralise l’initialisation RHF (resolver + baseline).
 * - Resync automatiquement la baseline quand `initialValues` change.
 * - Remonte l’état dirty au parent si demandé.
 * - Remonte les valeurs live si demandé (preview draft).
 * - Expose les helpers RHF utiles (`setValue`, `trigger`, `clearErrors`, `getFieldState`,
 *   `getValues`, `setFocus`) pour les sections ayant une logique UI plus riche.
 * - Ne contient aucune logique métier propre à une section.
 */

import { useCallback, useEffect } from "react";
import {
  type Control,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type FormState,
  type Resolver,
  type UseFormClearErrors,
  type UseFormGetFieldState,
  type UseFormGetValues,
  type UseFormHandleSubmit,
  type UseFormSetFocus,
  type UseFormSetValue,
  type UseFormTrigger,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";

import { useStableOnValuesChange } from "@compoz/ui/hooks/useStableOnValuesChange";

type UseSettingsSectionFormParams<TValues extends FieldValues> = Readonly<{
  resolver: Resolver<TValues, undefined, TValues>;
  initialValues: TValues;
  isSaving?: boolean;
  onValuesChange?: (values: TValues) => void;
  onDirtyChange?: (dirty: boolean) => void;
}>;

type UseSettingsSectionFormResult<TValues extends FieldValues> = Readonly<{
  control: Control<TValues, undefined, TValues>;
  handleSubmit: UseFormHandleSubmit<TValues, TValues>;
  setValue: UseFormSetValue<TValues>;
  trigger: UseFormTrigger<TValues>;
  clearErrors: UseFormClearErrors<TValues>;
  getFieldState: UseFormGetFieldState<TValues>;
  getValues: UseFormGetValues<TValues>;
  setFocus: UseFormSetFocus<TValues>;
  resetToInitialValues: () => void;
  isDirty: boolean;
  isSubmitting: boolean;
  isBusy: boolean;
  disabledControls: boolean;
  errors: FieldErrors<TValues>;
  touchedFields: FormState<TValues>["touchedFields"];
  submitCount: number;
  isSubmitted: boolean;
}>;

export function useSettingsSectionForm<TValues extends FieldValues>({
  resolver,
  initialValues,
  isSaving,
  onValuesChange,
  onDirtyChange,
}: UseSettingsSectionFormParams<TValues>): UseSettingsSectionFormResult<TValues> {
  const {
    control,
    handleSubmit,
    reset: rhfReset,
    setValue,
    trigger,
    clearErrors,
    getFieldState,
    getValues,
    setFocus,
  } = useForm<TValues, undefined, TValues>({
    resolver,
    defaultValues: initialValues as DefaultValues<TValues>,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const {
    isDirty,
    isSubmitting,
    errors,
    touchedFields,
    submitCount,
    isSubmitted,
  } = useFormState({ control });

  const isBusy = Boolean(isSaving || isSubmitting);
  const disabledControls = isBusy;

  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    console.log(
      "[useSettingsSectionForm] reset with initialValues",
      initialValues,
    );

    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  const watched = useWatch({ control }) as TValues | undefined;
  const values = watched ?? initialValues;
  useStableOnValuesChange(values, onValuesChange);

  const resetToInitialValues = useCallback(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  return {
    control,
    handleSubmit,
    setValue,
    trigger,
    clearErrors,
    getFieldState,
    getValues,
    setFocus,
    resetToInitialValues,
    isDirty,
    isSubmitting,
    isBusy,
    disabledControls,
    errors,
    touchedFields,
    submitCount,
    isSubmitted,
  };
}
