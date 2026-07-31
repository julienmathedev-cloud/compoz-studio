"use client";

/**
 * @file apps/studio/src/features/settings/identity/components/organisms/IdentityForm.tsx
 * @layer studio/features/settings/identity/components/organisms
 *
 * @description
 * RHF and Zod Studio form for site identity settings.
 *
 * @remarks
 * - Keeps logo and favicon wiring in RHF-aware field groups while this form owns near-limit hints and invalid-submit focus.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import type { FieldErrors } from "react-hook-form";
import { Controller, useController, useWatch } from "react-hook-form";

import {
  IDENTITY_SITENAME,
  IDENTITY_TAGLINE,
} from "@compoz/core/constants/limits/identity";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import { FaviconFields } from "@compoz/studio/features/settings/identity/components/molecules/FaviconFields";
import { LogoFields } from "@compoz/studio/features/settings/identity/components/molecules/LogoFields";
import type { IdentityWarningKey } from "@compoz/studio/features/settings/identity/validate";
import { useIdentityUiWarnings } from "@compoz/studio/features/settings/identity/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { focusByFieldId } from "@compoz/ui/lib/focus";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import {
  IdentityFormSchema,
  type IdentityFormValues,
} from "@compoz/validation/site/settings/identity/identity-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

const NEAR_LIMIT_THRESHOLD = 10;

/** Invalid-submit focus priority; `logo.alt` is targeted through the generated field id. */
const FIELD_PRIORITY = ["siteName", "logo.alt"] as const;

type FocusableFieldName = (typeof FIELD_PRIORITY)[number];

type IdentityFormProps = Readonly<{
  initialValues: IdentityFormValues;

  isSaving?: boolean;
  isConflictResolving?: boolean;

  onSubmit: (values: IdentityFormValues) => void | Promise<void>;

  onReset?: () => void;

  onUploadLogo?: (file: File) => Promise<UploadedRasterImage>;

  onUploadFavicon?: (file: File) => Promise<UploadedRasterImage>;

  onWarningKeysChange?: (keys: IdentityWarningKey[]) => void;

  onBlockingErrorsCountChange?: (count: number) => void;

  onDirtyChange?: (dirty: boolean) => void;
}>;

export function IdentityForm({
  initialValues,
  isSaving,
  isConflictResolving,
  onSubmit,
  onReset,
  onUploadLogo,
  onUploadFavicon,
  onWarningKeysChange,
  onBlockingErrorsCountChange,
  onDirtyChange,
}: IdentityFormProps) {
  const t = useTranslations();

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
  } = useSettingsSectionForm<IdentityFormValues>({
    resolver: zodResolver(IdentityFormSchema),
    initialValues,
    isSaving,
    isConflictResolving,
    onDirtyChange,
  });

  const idPrefix = useIdPrefix("identity-form");

  const siteNameIds = createFieldIds(idPrefix, "siteName");
  const taglineIds = createFieldIds(idPrefix, "tagline");
  const faviconIds = createFieldIds(idPrefix, "faviconUrl");
  const logoAltIds = createFieldIds(idPrefix, "logo.alt");

  /** Watched values drive near-limit hints, identity warnings, and media field groups. */
  const watchedValues = useWatch({ control });
  const values: IdentityFormValues = (watchedValues ??
    initialValues) as IdentityFormValues;

  const siteName = values.siteName ?? "";
  const tagline = values.tagline ?? "";

  const siteNameRemaining = Math.max(
    0,
    IDENTITY_SITENAME.MAX - siteName.length,
  );
  const taglineRemaining = Math.max(0, IDENTITY_TAGLINE.MAX - tagline.length);

  const siteNameHelpDynamic =
    siteNameRemaining <= NEAR_LIMIT_THRESHOLD
      ? t("studio.identityForm.siteName.helpNearLimit", {
          remaining: siteNameRemaining,
        })
      : t("studio.identityForm.siteName.help");

  const taglineHelpDynamic =
    tagline && taglineRemaining <= NEAR_LIMIT_THRESHOLD
      ? t("studio.identityForm.tagline.helpNearLimit", {
          remaining: taglineRemaining,
        })
      : t("studio.identityForm.tagline.help");

  const logoCtrl = useController({
    name: "logo",
    control,
  });

  const faviconUrlCtrl = useController({
    name: "faviconUrl",
    control,
  });

  const faviconMediaAssetIdCtrl = useController({
    name: "faviconMediaAssetId",
    control,
  });

  const showError = isSubmitted || submitCount > 0;

  const invalidSiteName =
    (showError || Boolean(touchedFields.siteName)) &&
    Boolean(errors.siteName?.message ?? errors.siteName);

  const siteNameErrorMessage =
    (showError || Boolean(touchedFields.siteName)) && errors.siteName?.message
      ? String(errors.siteName.message)
      : undefined;

  const hasLogo = values.logo !== null;

  const touchedLogoAlt =
    typeof touchedFields.logo === "object" &&
    touchedFields.logo !== null &&
    Boolean(touchedFields.logo.alt);

  const invalidLogoAlt =
    hasLogo &&
    (showError || touchedLogoAlt) &&
    Boolean(errors.logo?.alt?.message ?? errors.logo?.alt);

  const logoAltErrorMessage =
    hasLogo && (showError || touchedLogoAlt) && errors.logo?.alt?.message
      ? String(errors.logo.alt.message)
      : undefined;

  const warningKeys = useIdentityUiWarnings(values.logo, values.faviconUrl);

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  const blockingErrorsCount = useMemo(() => {
    return [invalidSiteName, invalidLogoAlt].filter(Boolean).length;
  }, [invalidSiteName, invalidLogoAlt]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  function handleSubmitErrors(formErrors: FieldErrors<IdentityFormValues>) {
    notify.error(t("uiErrors.formHasErrors"));

    const firstField = FIELD_PRIORITY.find((fieldName) => {
      if (fieldName === "siteName") {
        return Boolean(formErrors.siteName);
      }

      if (fieldName === "logo.alt") {
        if (!hasLogo) return false;
        return Boolean(formErrors.logo?.alt);
      }

      return false;
    });

    if (!firstField) return;

    const fieldIdByName: Record<FocusableFieldName, string> = {
      siteName: siteNameIds.fieldId,
      "logo.alt": logoAltIds.fieldId,
    };

    focusByFieldId(fieldIdByName[firstField]);
  }

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(
        (submittedValues) => onSubmit(submittedValues),
        handleSubmitErrors,
      )}
      noValidate
    >
      <Card variant="panel" visualMode="studio">
        <CardContent className={cn(STACK_MD)}>
          <FormGrid>
            <Controller
              name="siteName"
              control={control}
              render={({ field }) => (
                <InputField
                  ids={siteNameIds}
                  label={t("studio.identityForm.siteName.label")}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value)}
                  onBlur={field.onBlur}
                  placeholder={t("studio.identityForm.siteName.placeholder")}
                  help={siteNameHelpDynamic}
                  required
                  disabled={disabledControls}
                  showCount
                  maxLength={IDENTITY_SITENAME.MAX}
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  invalid={invalidSiteName}
                  error={siteNameErrorMessage}
                  className="min-w-0"
                />
              )}
            />

            <Controller
              name="tagline"
              control={control}
              render={({ field }) => (
                <InputField
                  ids={taglineIds}
                  label={t("studio.identityForm.tagline.label")}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value)}
                  onBlur={field.onBlur}
                  placeholder={t("studio.identityForm.tagline.placeholder")}
                  help={taglineHelpDynamic}
                  disabled={disabledControls}
                  showCount
                  maxLength={IDENTITY_TAGLINE.MAX}
                  autoCapitalize="sentences"
                  autoCorrect="on"
                />
              )}
            />
          </FormGrid>

          <Separator />

          <FormGrid>
            <LogoFields
              idPrefix={idPrefix}
              siteName={values.siteName ?? ""}
              logoField={logoCtrl.field}
              disabled={disabledControls}
              invalidAlt={invalidLogoAlt}
              altErrorMessage={logoAltErrorMessage}
              onUploadLogo={onUploadLogo}
            />

            <FaviconFields
              siteName={values.siteName ?? ""}
              logoAlt={values.logo?.alt ?? ""}
              faviconUrlField={faviconUrlCtrl.field}
              faviconMediaAssetIdField={faviconMediaAssetIdCtrl.field}
              faviconIds={faviconIds}
              disabled={disabledControls}
              onUploadFavicon={onUploadFavicon}
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

IdentityForm.displayName = "IdentityForm";
