"use client";

/**
 * @file apps/studio/src/features/settings/footer/FooterForm.tsx
 * @layer studio/features/settings/footer
 *
 * @description
 * RHF and Zod Studio form for footer settings.
 *
 * @remarks
 * - Reports warnings, dirty state, blocking-error count, and live values to callers for section state and preview drafts.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useController, useWatch } from "react-hook-form";

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import type { FooterWarningKey } from "@compoz/studio/features/settings/footer/validate";
import { useFooterUiWarnings } from "@compoz/studio/features/settings/footer/validate";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import {
  FooterFormSchema,
  type FooterFormValues,
} from "@compoz/validation/site/settings/footer/footer-form";

type FooterFormProps = Readonly<{
  initialValues: FooterFormValues;
  isSaving?: boolean;
  isConflictResolving?: boolean;
  onSubmit: (values: FooterFormValues) => void | Promise<void>;
  onReset?: () => void;
  onWarningKeysChange?: (keys: FooterWarningKey[]) => void;
  onValuesChange?: (values: FooterFormValues) => void;
  onBlockingErrorsCountChange?: (count: number) => void;
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function FooterForm({
  initialValues,
  isSaving,
  isConflictResolving,
  onSubmit,
  onReset,
  onWarningKeysChange,
  onValuesChange,
  onBlockingErrorsCountChange,
  onDirtyChange,
}: FooterFormProps) {
  const {
    control,
    handleSubmit,
    resetToInitialValues,
    isDirty,
    isBusy,
    disabledControls,
    errors,
    touchedFields,
    submitCount,
    isSubmitted,
  } = useSettingsSectionForm<FooterFormValues>({
    resolver: zodResolver(FooterFormSchema),
    initialValues,
    isSaving,
    isConflictResolving,
    onValuesChange,
    onDirtyChange,
  });

  const t = useTranslations();

  const idPrefix = useIdPrefix("footer-form");

  const showYearIds = createFieldIds(idPrefix, "showYear");
  const copyrightIds = createFieldIds(idPrefix, "copyright");

  const showYearCtrl = useController({ name: "showYear", control });
  const copyrightCtrl = useController({ name: "copyright", control });

  const [showYearWatch, copyrightWatch] = useWatch({
    control,
    name: ["showYear", "copyright"],
  });

  const warningKeys = useFooterUiWarnings(
    copyrightWatch,
    Boolean(showYearWatch),
  );

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  const showError = isSubmitted || submitCount > 0;

  const invalidCopyright =
    (showError || Boolean(touchedFields.copyright)) &&
    Boolean(errors.copyright?.message ?? errors.copyright);

  const copyrightError =
    (showError || Boolean(touchedFields.copyright)) && errors.copyright?.message
      ? String(errors.copyright.message)
      : undefined;

  const blockingErrorsCount = useMemo(() => {
    return [invalidCopyright].filter(Boolean).length;
  }, [invalidCopyright]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  const toBool = (v: boolean | "indeterminate") => v === true;

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Card variant="panel" visualMode="studio">
        <CardContent>
          <FormGrid>
            <InputField
              ids={copyrightIds}
              label={t("studio.footerForm.copyright.label")}
              help={t("studio.footerForm.copyright.help")}
              value={String(copyrightCtrl.field.value ?? "")}
              onChange={(v) => copyrightCtrl.field.onChange(v)}
              onBlur={copyrightCtrl.field.onBlur}
              placeholder={t("studio.footerForm.copyright.placeholder")}
              disabled={disabledControls}
              autoCapitalize="sentences"
              autoCorrect="on"
              invalid={invalidCopyright}
              error={copyrightError}
            />

            <SwitchField
              ids={showYearIds}
              label={t("studio.footerForm.showYear.label")}
              help={t("studio.footerForm.showYear.help")}
              checked={Boolean(showYearCtrl.field.value)}
              onCheckedChange={(v) => showYearCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />
          </FormGrid>
        </CardContent>

        <CardFooter>
          <ActionsBar
            variant="resetSubmit"
            isSaving={isBusy}
            isDirty={isDirty}
            onReset={() => {
              resetToInitialValues();
              onReset?.();
            }}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

FooterForm.displayName = "FooterForm";
