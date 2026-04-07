"use client";

/**
 * @file apps/studio/src/features/settings/identity/IdentityForm.tsx
 * @layer ui/studio/settings/identity/organisms
 *
 * @description
 * Formulaire d’édition de l’identité (titre, tagline, logo, favicon) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Les groupes Logo / Favicon sont gérés via des composants RHF-aware (`LogoFields`, `FaviconFields`).
 * - La logique “near limit” sur `siteName` / `tagline` reste locale à ce formulaire.
 * - Le reset RHF est géré localement puis notifié au parent via `onReset` (optionnel).
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
}>;

/**
 * Seuil à partir duquel on affiche une aide “proche de la limite”.
 */
const NEAR_LIMIT_THRESHOLD = 10;

/**
 * Priorité de focus des champs bloquants lors d’un submit invalide.
 *
 * @remarks
 * - `logo` est un objet complexe.
 * - On cible explicitement le champ `logo.alt` via l’ID généré par `LogoFields`.
 */
const FIELD_PRIORITY = ["siteName", "logo.alt"] as const;

type FocusableFieldName = (typeof FIELD_PRIORITY)[number];

/**
 * Props du composant `IdentityForm`.
 */
type IdentityFormProps = Readonly<{
  /** Valeurs initiales (baseline) fournies par la section. */
  initialValues: IdentityFormValues;

  /** Indique qu’une sauvegarde est en cours côté parent. */
  isSaving?: boolean;

  /** Callback appelé avec des valeurs validées par Zod (`IdentityFormSchema`). */
  onSubmit: (values: IdentityFormValues) => void | Promise<void>;

  /** Handler optionnel : permet au parent de réagir à un reset UI. */
  onReset?: () => void;

  /** Upload optionnel du logo : reçoit un fichier et retourne une URL publique. */
  onUploadLogo?: (file: File) => Promise<UploadedRasterImage>;

  /** Upload optionnel de la favicon : reçoit un fichier et retourne une URL publique. */
  onUploadFavicon?: (file: File) => Promise<UploadedRasterImage>;

  /** Handler optionnel : remonte les warnings UI (non bloquants). */
  onWarningKeysChange?: (keys: IdentityWarningKey[]) => void;

  /** Handler optionnel : remonte le nombre d’erreurs bloquantes. */
  onBlockingErrorsCountChange?: (count: number) => void;

  /** Handler optionnel : remonte l’état dirty (guard / navigation). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

/**
 * Formulaire de configuration de l’identité du site (studio).
 */
export function IdentityForm({
  initialValues,
  isSaving,
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
    isSubmitting,
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
    onDirtyChange,
  });

  /**
   * Préfixe stable pour ce formulaire (IDs dérivés : siteName, tagline, favicon, etc.).
   */
  const idPrefix = useIdPrefix("identity-form");

  /**
   * IDs pour les champs simples (`InputField`).
   */
  const siteNameIds = createFieldIds(idPrefix, "siteName");
  const taglineIds = createFieldIds(idPrefix, "tagline");
  const faviconIds = createFieldIds(idPrefix, "faviconUrl");
  const logoAltIds = createFieldIds(idPrefix, "logo.alt");

  /**
   * Valeurs RHF live :
   * - aides "near limit" (`siteName` / `tagline`)
   * - warnings d’identité (`logo` / `faviconUrl`)
   * - alimentation de `LogoFields` / `FaviconFields`
   */
  const watchedValues = useWatch({ control });
  const values: IdentityFormValues = (watchedValues ??
    initialValues) as IdentityFormValues;

  const siteName = values.siteName ?? "";
  const tagline = values.tagline ?? "";

  /**
   * Aides "near limit" (non bloquantes) sur `siteName` / `tagline`.
   */
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

  /**
   * Champs RHF dédiés pour les groupes Logo / Favicon.
   */
  const logoCtrl = useController({
    name: "logo",
    control,
  });

  const faviconUrlCtrl = useController({
    name: "faviconUrl",
    control,
  });

  const showError = isSubmitted || submitCount > 0;

  /**
   * Erreurs bloquantes.
   */
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

  /**
   * Warnings d’identité (logo / favicon) basés sur les valeurs RHF.
   */
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
              faviconIds={faviconIds}
              disabled={disabledControls}
              onUploadFavicon={onUploadFavicon}
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

IdentityForm.displayName = "IdentityForm";
