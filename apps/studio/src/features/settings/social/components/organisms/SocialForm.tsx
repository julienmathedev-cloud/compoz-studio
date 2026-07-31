"use client";

/**
 * @file apps/studio/src/features/settings/social/components/organisms/SocialForm.tsx
 * @layer studio/features/settings/social/components/organisms
 *
 * @description
 * RHF and Zod-backed studio form for editing social links.
 *
 * @remarks
 * - Uses `useFieldArray` with a dedicated row so each social item owns its controllers.
 * - Reports UI warnings, blocking error count, value changes, and dirty state to the parent section.
 * - Focuses the first row-level blocking error after a failed submit.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { FieldErrors } from "react-hook-form";
import {
  useController,
  useFieldArray,
  useFormState,
  useWatch,
  type Control,
  type ControllerRenderProps,
  type FieldArrayWithId,
  type UseFormClearErrors,
  type UseFormSetValue,
  type UseFormTrigger,
} from "react-hook-form";

import { DEFAULT_SOCIAL_KIND } from "@compoz/core/constants/social/social-kinds";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { focusFirstArrayFieldError } from "@compoz/studio/features/settings/_shared/focusFirstArrayFieldError";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import { SocialFieldsItem } from "@compoz/studio/features/settings/social/components/molecules/SocialFieldsItem";
import {
  useSocialUiWarnings,
  type SocialWarningKey,
} from "@compoz/studio/features/settings/social/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import {
  SocialFormSchema,
  type SocialFormValues,
  type SocialItemFormValues,
} from "@compoz/validation/site/settings/social/social-form";

type SocialFormProps = Readonly<{
  initialValues: SocialFormValues;

  isSaving?: boolean;
  isConflictResolving?: boolean;

  onSubmit: (values: SocialFormValues) => void | Promise<void>;

  onReset?: () => void;

  onWarningKeysChange?: (keys: SocialWarningKey[]) => void;

  onValuesChange?: (values: SocialFormValues) => void;

  onBlockingErrorsCountChange?: (count: number) => void;

  onDirtyChange?: (dirty: boolean) => void;
}>;

type RowErrorMessages = Partial<Record<"kind" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"kind" | "href", boolean>>;

type SocialItemRowProps = Readonly<{
  index: number;
  field: FieldArrayWithId<SocialFormValues, "items", "fieldId">;
  control: Control<SocialFormValues>;
  trigger: UseFormTrigger<SocialFormValues>;
  setValue: UseFormSetValue<SocialFormValues>;
  clearErrors: UseFormClearErrors<SocialFormValues>;
  disabled: boolean;
  showError: boolean;
  rowIdPrefix: string;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}>;

/** RHF-connected row for one social item. */
function SocialItemRow({
  index,
  field,
  control,
  trigger,
  setValue,
  clearErrors,
  disabled,
  showError,
  rowIdPrefix,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SocialItemRowProps) {
  const kindCtrl = useController({
    name: `items.${index}.kind` as const,
    control,
  });

  const hrefCtrl = useController({
    name: `items.${index}.href` as const,
    control,
  });

  const invalid: RowInvalidFlags = {
    kind:
      (showError || kindCtrl.fieldState.isTouched) &&
      Boolean(kindCtrl.fieldState.error?.message),
    href:
      (showError || hrefCtrl.fieldState.isTouched) &&
      Boolean(hrefCtrl.fieldState.error?.message),
  };

  const error: RowErrorMessages = {
    kind:
      (showError || kindCtrl.fieldState.isTouched) &&
      kindCtrl.fieldState.error?.message
        ? String(kindCtrl.fieldState.error.message)
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

    void trigger(`items.${index}.href` as const);
  };

  /** Clears href without validation so switching email/URL mode preserves PATCH intent. */
  const clearHrefBySwitch = () => {
    const name = `items.${index}.href` as const;

    clearErrors(name);

    setValue(name, "", {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });
  };

  return (
    <SocialFieldsItem
      key={field.fieldId}
      idPrefix={rowIdPrefix}
      disabled={disabled}
      isFirst={isFirst}
      isLast={isLast}
      onRemove={onRemove}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      kindField={
        kindCtrl.field as ControllerRenderProps<
          SocialFormValues,
          `items.${number}.kind`
        >
      }
      hrefField={
        hrefCtrl.field as ControllerRenderProps<
          SocialFormValues,
          `items.${number}.href`
        >
      }
      invalid={invalid}
      error={error}
      onHrefValidateNow={validateHrefNow}
      onHrefClearBySwitch={clearHrefBySwitch}
    />
  );
}

export function SocialForm({
  initialValues,
  isSaving,
  isConflictResolving,
  onSubmit,
  onReset,
  onWarningKeysChange,
  onValuesChange,
  onBlockingErrorsCountChange,
  onDirtyChange,
}: SocialFormProps) {
  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    clearErrors,
    getFieldState,
    resetToInitialValues,
    isDirty,
    isBusy,
    submitCount,
  } = useSettingsSectionForm<SocialFormValues>({
    resolver: zodResolver(SocialFormSchema),
    initialValues,
    isSaving,
    isConflictResolving,
    onValuesChange,
    onDirtyChange,
  });

  // Subscribe to item-level form state so row errors update without watching the whole form state.
  const itemsState = useFormState({ control, name: "items" });

  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const t = useTranslations();

  const { fields, append, remove, move } = useFieldArray<
    SocialFormValues,
    "items",
    "fieldId"
  >({
    control,
    name: "items",
    keyName: "fieldId",
  });

  const formIdPrefix = useIdPrefix("social-form");

  const watched = useWatch({ control }) as SocialFormValues | undefined;
  const values = watched ?? initialValues;

  const warningKeys = useSocialUiWarnings(values.items ?? []);

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  const createEmptyItem = (): SocialItemFormValues => ({
    id: crypto.randomUUID(),
    kind: DEFAULT_SOCIAL_KIND,
    href: "",
  });

  const showError = hasSubmittedOnce || submitCount > 0;

  // Section badges count row-level blocking errors from the current field-array state.
  const blockingErrorsCount = useMemo(() => {
    const items = values.items ?? [];
    let count = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const kind = getFieldState(`items.${idx}.kind` as const, itemsState);
      const href = getFieldState(`items.${idx}.href` as const, itemsState);

      if (kind.error) count++;
      if (href.error) count++;
    }

    return count;
  }, [values.items, itemsState, getFieldState]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(
        (validValues) => {
          setHasSubmittedOnce(false);
          return onSubmit(validValues);
        },
        (formErrors: FieldErrors<SocialFormValues>) => {
          setHasSubmittedOnce(true);
          notify.error(t("uiErrors.formHasErrors"));

          focusFirstArrayFieldError<"kind" | "href">({
            itemErrors: formErrors.items,
            fieldPriority: ["kind", "href"],
            getFieldId: (index, field) => {
              const rowIdPrefix = `${formIdPrefix}-item-${index}`;
              return createFieldIds(rowIdPrefix, field).fieldId;
            },
          });
        },
      )}
      noValidate
    >
      <Card variant="panel" visualMode="studio">
        <CardContent className={cn(STACK_MD)}>
          {fields.length === 0 ? (
            <EmptyState text={t("studio.socialForm.empty")} />
          ) : (
            fields.map((field, index) => {
              const rowIdPrefix = `${formIdPrefix}-item-${index}`;

              return (
                <Fragment key={field.fieldId}>
                  <SocialItemRow
                    index={index}
                    field={field}
                    control={control}
                    trigger={trigger}
                    setValue={setValue}
                    clearErrors={clearErrors}
                    disabled={isBusy}
                    showError={showError}
                    rowIdPrefix={rowIdPrefix}
                    isFirst={index === 0}
                    isLast={index === fields.length - 1}
                    onRemove={() => remove(index)}
                    onMoveUp={() => move(index, Math.max(0, index - 1))}
                    onMoveDown={() =>
                      move(index, Math.min(fields.length - 1, index + 1))
                    }
                  />
                  {index < fields.length - 1 ? <Separator /> : null}
                </Fragment>
              );
            })
          )}
        </CardContent>

        <CardFooter>
          <ActionsBar
            variant="addResetSubmit"
            isSaving={isBusy}
            isDirty={isDirty}
            onAdd={() => append(createEmptyItem())}
            onReset={() => {
              resetToInitialValues();
              onReset?.();
            }}
            addLabel={t("studio.socialForm.addLink")}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

SocialForm.displayName = "SocialForm";
