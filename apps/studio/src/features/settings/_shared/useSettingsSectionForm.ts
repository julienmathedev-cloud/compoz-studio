"use client";

/**
 * @file apps/studio/src/features/settings/_shared/useSettingsSectionForm.ts
 * @layer studio/features/settings/shared
 *
 * @description
 * Shared RHF setup hook for Studio settings sections.
 *
 * @remarks
 * - Resets the form baseline when `initialValues` changes.
 * - Reports dirty state and live values to callers for dirty guards and preview drafts.
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
  isConflictResolving?: boolean;
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
  isConflictResolving,
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

  const isBusy = Boolean(isSaving || isSubmitting || isConflictResolving);
  const disabledControls = isBusy;

  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
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
