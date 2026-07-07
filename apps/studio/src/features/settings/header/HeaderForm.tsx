"use client";

/**
 * @file apps/studio/src/features/settings/header/HeaderForm.tsx
 * @layer studio/features/settings/header
 *
 * @description
 * RHF and Zod Studio form for header settings.
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
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import type { HeaderWarningKey } from "@compoz/studio/features/settings/header/validate";
import { useHeaderUiWarnings } from "@compoz/studio/features/settings/header/validate";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import {
  HeaderFormSchema,
  type HeaderFormValues,
} from "@compoz/validation/site/settings/header/header-form";

type HeaderFormProps = Readonly<{
  initialValues: HeaderFormValues;
  isSaving?: boolean;
  onSubmit: (values: HeaderFormValues) => void | Promise<void>;
  onReset?: () => void;
  onWarningKeysChange?: (keys: HeaderWarningKey[]) => void;
  onValuesChange?: (values: HeaderFormValues) => void;
  onBlockingErrorsCountChange?: (count: number) => void;
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function HeaderForm({
  initialValues,
  isSaving,
  onSubmit,
  onReset,
  onWarningKeysChange,
  onValuesChange,
  onBlockingErrorsCountChange,
  onDirtyChange,
}: HeaderFormProps) {
  const {
    control,
    handleSubmit,
    resetToInitialValues,
    isDirty,
    isSubmitting,
    isBusy,
    disabledControls,
    errors,
  } = useSettingsSectionForm<HeaderFormValues>({
    resolver: zodResolver(HeaderFormSchema),
    initialValues,
    isSaving,
    onValuesChange,
    onDirtyChange,
  });

  const t = useTranslations();

  const idPrefix = useIdPrefix("header-form");

  const showLogoIds = createFieldIds(idPrefix, "showLogo");
  const showSiteNameIds = createFieldIds(idPrefix, "showSiteName");
  const stickyIds = createFieldIds(idPrefix, "sticky");
  const blurIds = createFieldIds(idPrefix, "blur");
  const swapZonesIds = createFieldIds(idPrefix, "swapPrimaryAndSocial");

  const showLogoCtrl = useController({ name: "showLogo", control });
  const showSiteNameCtrl = useController({ name: "showSiteName", control });
  const stickyCtrl = useController({ name: "sticky", control });
  const blurCtrl = useController({ name: "blur", control });
  const swapCtrl = useController({ name: "swapPrimaryAndSocial", control });

  const watchedForWarnings = useWatch({
    control,
    name: ["showLogo", "showSiteName"],
  }) as [boolean | undefined, boolean | undefined];

  const warningKeys = useHeaderUiWarnings(
    Boolean(watchedForWarnings?.[0]),
    Boolean(watchedForWarnings?.[1]),
  );

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  const blockingErrorsCount = useMemo(() => {
    const fields: Array<keyof HeaderFormValues> = [
      "showLogo",
      "showSiteName",
      "sticky",
      "blur",
      "swapPrimaryAndSocial",
    ];

    let count = 0;
    for (const k of fields) {
      if (errors?.[k]) count++;
    }
    return count;
  }, [errors]);

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
            <SwitchField
              ids={showLogoIds}
              label={t("studio.headerForm.showLogo.label")}
              help={t("studio.headerForm.showLogo.help")}
              checked={Boolean(showLogoCtrl.field.value)}
              onCheckedChange={(v) => showLogoCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />

            <SwitchField
              ids={showSiteNameIds}
              label={t("studio.headerForm.showSiteName.label")}
              help={t("studio.headerForm.showSiteName.help")}
              checked={Boolean(showSiteNameCtrl.field.value)}
              onCheckedChange={(v) =>
                showSiteNameCtrl.field.onChange(toBool(v))
              }
              disabled={disabledControls}
            />

            <SwitchField
              ids={stickyIds}
              label={t("studio.headerForm.sticky.label")}
              help={t("studio.headerForm.sticky.help")}
              checked={Boolean(stickyCtrl.field.value)}
              onCheckedChange={(v) => stickyCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />

            <SwitchField
              ids={blurIds}
              label={t("studio.headerForm.blur.label")}
              help={t("studio.headerForm.blur.help")}
              checked={Boolean(blurCtrl.field.value)}
              onCheckedChange={(v) => blurCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />

            <SwitchField
              ids={swapZonesIds}
              label={t("studio.headerForm.swapPrimaryAndSocial.label")}
              help={t("studio.headerForm.swapPrimaryAndSocial.help")}
              checked={Boolean(swapCtrl.field.value)}
              onCheckedChange={(v) => swapCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />
          </FormGrid>
        </CardContent>

        <CardFooter>
          <ActionsBar
            variant="resetSubmit"
            isSaving={isSaving || isSubmitting}
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

HeaderForm.displayName = "HeaderForm";
