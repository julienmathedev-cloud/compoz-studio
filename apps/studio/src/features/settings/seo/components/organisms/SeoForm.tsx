"use client";

/**
 * @file apps/studio/src/features/settings/seo/SeoForm.tsx
 * @layer ui/studio/organisms
 *
 * @description
 * Formulaire de configuration SEO global (base, indexation, Open Graph, Twitter).
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - RHF + Zod sont la source de vérité UI : le modèle `SeoFormValues` est stable côté champs.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF live et remontés au parent.
 * - Les erreurs bloquantes sont affichées au plus près des champs (near-field).
 * - UX : focus/scroll sur le premier champ invalide au submit (IDs stables, sans ref).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import type { FieldErrors } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";

import { SEO } from "@compoz/core/constants/limits/seo";
import { TWITTER_CARD_TYPES } from "@compoz/core/constants/seo/seo";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { HelperChips } from "@compoz/studio/components/molecules/controls/HelperChips";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import { SeoIndexationFields } from "@compoz/studio/features/settings/seo/components/molecules/SeoIndexationFields";
import { SeoOpenGraphFields } from "@compoz/studio/features/settings/seo/components/molecules/SeoOpenGraphFields";
import { SeoTwitterFields } from "@compoz/studio/features/settings/seo/components/molecules/SeoTwitterFields";
import type { SeoWarningKey } from "@compoz/studio/features/settings/seo/validate";
import { useSeoUiWarnings } from "@compoz/studio/features/settings/seo/validate";
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
  SeoFormSchema,
  type SeoFormValues,
} from "@compoz/validation/site/settings/seo/seo-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

/**
 * Props du composant `SeoForm`.
 */
type SeoFormProps = Readonly<{
  /** Valeurs initiales (baseline) fournies par la section. */
  initialValues: SeoFormValues;
  /** Indique qu’une sauvegarde côté parent est en cours. */
  isSaving?: boolean;
  /** Callback appelé avec des valeurs validées par Zod (`SeoFormSchema`). */
  onSubmit: (values: SeoFormValues) => void | Promise<void>;
  /** Handler optionnel : permet au parent de réagir à un reset UI. */
  onReset?: () => void;
  /** Handler optionnel : remonte les warnings UI (non bloquants). */
  onWarningKeysChange?: (keys: SeoWarningKey[]) => void;
  /** Handler optionnel : remonte les valeurs live (preview draft). */
  onValuesChange?: (values: SeoFormValues) => void;
  /** Handler optionnel : remonte l’état dirty (guard / navigation). */
  onDirtyChange?: (dirty: boolean) => void;
  /** Handler optionnel : remonte le nombre d’erreurs bloquantes (badges section). */
  onBlockingErrorsCountChange?: (count: number) => void;
  /** Upload optionnel OG image : reçoit un fichier et retourne une URL publique. */
  onUploadOgImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

/**
 * Formulaire de configuration SEO (studio).
 */
export function SeoForm({
  initialValues,
  isSaving,
  onSubmit,
  onReset,
  onWarningKeysChange,
  onValuesChange,
  onDirtyChange,
  onBlockingErrorsCountChange,
  onUploadOgImage,
}: SeoFormProps) {
  const t = useTranslations();

  // Fallback twitter.card (ex: "summary_large_image")
  const fallbackCard = TWITTER_CARD_TYPES[1];

  // RHF defaults robustes : évite les `undefined` (ex. twitter.card).
  const rhfDefaults = useMemo((): SeoFormValues => {
    const twitter = initialValues.twitter ?? { card: fallbackCard };

    return {
      ...initialValues,
      twitter: {
        ...twitter,
        card: twitter.card ?? fallbackCard,
      },
    };
  }, [initialValues, fallbackCard]);

  const {
    control,
    handleSubmit,
    setValue,
    resetToInitialValues,
    isDirty,
    isSubmitting,
    isBusy,
    disabledControls,
    errors,
    touchedFields,
    submitCount,
  } = useSettingsSectionForm<SeoFormValues>({
    resolver: zodResolver(SeoFormSchema),
    initialValues: rhfDefaults,
    isSaving,
    onValuesChange,
    onDirtyChange,
  });

  // Préfixe d’ID stable pour ce formulaire.
  const idPrefix = useIdPrefix("seo-form");

  // Base
  const defaultTitleIds = createFieldIds(idPrefix, "defaultTitle");
  const titleTemplateIds = createFieldIds(idPrefix, "titleTemplate");
  const defaultDescriptionIds = createFieldIds(idPrefix, "defaultDescription");
  const canonicalUrlIds = createFieldIds(idPrefix, "canonicalUrl");
  const robotsIds = createFieldIds(idPrefix, "robots");

  // Indexation
  const baseUrlIds = createFieldIds(idPrefix, "baseUrl");

  // Sécurité `twitter.card` : force un fallback si le setting est incomplet.
  const watchedTwitter = useWatch({ control, name: "twitter" });

  useEffect(() => {
    if (!watchedTwitter?.card) {
      setValue(
        "twitter",
        { ...(watchedTwitter ?? {}), card: fallbackCard },
        { shouldDirty: false, shouldTouch: false, shouldValidate: false },
      );
    }
  }, [watchedTwitter, setValue, fallbackCard]);

  // Preview draft (valeurs live) — remonte le modèle UI.
  const watchedAll = useWatch({ control }) as SeoFormValues | undefined;
  const values = watchedAll ?? rhfDefaults;

  // Warnings UI (non bloquants).
  const warningKeys = useSeoUiWarnings(values);

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  // Erreurs near-field (affichées au plus près des champs).
  const showError = submitCount > 0;

  const defaultTitleError =
    (showError || !!touchedFields.defaultTitle) && errors.defaultTitle?.message
      ? String(errors.defaultTitle.message)
      : undefined;

  const titleTemplateError =
    (showError || !!touchedFields.titleTemplate) &&
    errors.titleTemplate?.message
      ? String(errors.titleTemplate.message)
      : undefined;

  const defaultDescriptionError =
    (showError || !!touchedFields.defaultDescription) &&
    errors.defaultDescription?.message
      ? String(errors.defaultDescription.message)
      : undefined;

  const baseUrlError =
    (showError || !!touchedFields.baseUrl) && errors.baseUrl?.message
      ? String(errors.baseUrl.message)
      : undefined;

  const invalidDefaultTitle =
    (showError || !!touchedFields.defaultTitle) &&
    Boolean(errors.defaultTitle?.message ?? errors.defaultTitle);

  const invalidTitleTemplate =
    (showError || !!touchedFields.titleTemplate) &&
    Boolean(errors.titleTemplate?.message ?? errors.titleTemplate);

  const invalidDefaultDescription =
    (showError || !!touchedFields.defaultDescription) &&
    Boolean(errors.defaultDescription?.message ?? errors.defaultDescription);

  const invalidBaseUrl =
    (showError || !!touchedFields.baseUrl) &&
    Boolean(errors.baseUrl?.message ?? errors.baseUrl);

  const canonicalUrlError =
    (showError || !!touchedFields.canonicalUrl) && errors.canonicalUrl?.message
      ? String(errors.canonicalUrl.message)
      : undefined;

  const robotsError =
    (showError || !!touchedFields.robots) && errors.robots?.message
      ? String(errors.robots.message)
      : undefined;

  const invalidCanonicalUrl =
    (showError || !!touchedFields.canonicalUrl) &&
    Boolean(errors.canonicalUrl?.message ?? errors.canonicalUrl);

  const invalidRobots =
    (showError || !!touchedFields.robots) &&
    Boolean(errors.robots?.message ?? errors.robots);

  // Badges section : compteur d’erreurs bloquantes (simple & stable)
  const blockingErrorsCount = useMemo(() => {
    const invalids = [
      invalidDefaultTitle,
      invalidTitleTemplate,
      invalidDefaultDescription,
      invalidBaseUrl,
      invalidCanonicalUrl,
      invalidRobots,
      // NB: les erreurs “nested” (twitter/openGraph/indexation) restent gérées localement
      // par leurs sous-composants ; si un jour tu veux les compter, on peut ajouter un comptage deep.
    ];

    return invalids.filter(Boolean).length;
  }, [
    invalidDefaultTitle,
    invalidTitleTemplate,
    invalidDefaultDescription,
    invalidBaseUrl,
    invalidCanonicalUrl,
    invalidRobots,
  ]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  const siteName = String(values.defaultTitle ?? "").trim() || "Nom du site";

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(
        async (v) => {
          await onSubmit(v);
        },
        (formErrors: FieldErrors<SeoFormValues>) => {
          notify.error(t("uiErrors.formHasErrors"));

          const fieldPriority: Array<
            | "defaultTitle"
            | "titleTemplate"
            | "defaultDescription"
            | "baseUrl"
            | "canonicalUrl"
            | "robots"
          > = [
            "defaultTitle",
            "titleTemplate",
            "defaultDescription",
            "baseUrl",
            "canonicalUrl",
            "robots",
          ];

          const first = fieldPriority.find((key) => !!formErrors[key]);
          if (!first) return;

          if (first === "defaultTitle") {
            return focusByFieldId(defaultTitleIds.fieldId);
          }

          if (first === "titleTemplate") {
            return focusByFieldId(titleTemplateIds.fieldId);
          }

          if (first === "defaultDescription") {
            return focusByFieldId(defaultDescriptionIds.fieldId);
          }

          if (first === "baseUrl") {
            return focusByFieldId(baseUrlIds.fieldId);
          }

          if (first === "canonicalUrl") {
            return focusByFieldId(canonicalUrlIds.fieldId);
          }

          if (first === "robots") {
            return focusByFieldId(robotsIds.fieldId);
          }
        },
      )}
      noValidate
    >
      <Card variant="panel">
        <CardContent className={cn(STACK_MD)}>
          <FormGrid>
            {/* ===== Base ===== */}
            <div className={cn(STACK_MD)}>
              <Controller
                name="defaultTitle"
                control={control}
                render={({ field }) => (
                  <InputField
                    ids={defaultTitleIds}
                    label={t("studio.seoForm.base.defaultTitle.label")}
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    onBlur={field.onBlur}
                    placeholder={t(
                      "studio.seoForm.base.defaultTitle.placeholder",
                    )}
                    help={t("studio.seoForm.base.defaultTitle.help")}
                    disabled={disabledControls}
                    invalid={invalidDefaultTitle}
                    error={defaultTitleError}
                  />
                )}
              />

              <Controller
                name="titleTemplate"
                control={control}
                render={({ field }) => (
                  <div className={cn(STACK_MD)}>
                    <InputField
                      ids={titleTemplateIds}
                      label={t("studio.seoForm.base.titleTemplate.label")}
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(v)}
                      onBlur={field.onBlur}
                      placeholder={t(
                        "studio.seoForm.base.titleTemplate.placeholder",
                      )}
                      help={t("studio.seoForm.base.titleTemplate.help")}
                      disabled={disabledControls}
                      invalid={invalidTitleTemplate}
                      error={titleTemplateError}
                    />

                    <HelperChips
                      items={["%s", `%s — ${siteName}`]}
                      onPick={(snippet) => field.onChange(snippet)}
                    />
                  </div>
                )}
              />
            </div>

            <div>
              <Controller
                name="defaultDescription"
                control={control}
                render={({ field }) => (
                  <TextareaField
                    ids={defaultDescriptionIds}
                    label={t("studio.seoForm.base.defaultDescription.label")}
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    onBlur={field.onBlur}
                    placeholder={t(
                      "studio.seoForm.base.defaultDescription.placeholder",
                    )}
                    rows={6}
                    disabled={disabledControls}
                    help={t("studio.seoForm.base.defaultDescription.help")}
                    showCount
                    maxLength={SEO.DESCRIPTION.MAX}
                    invalid={invalidDefaultDescription}
                    error={defaultDescriptionError}
                  />
                )}
              />
            </div>
          </FormGrid>

          <Separator />

          <FormGrid>
            {/* ===== Indexation ===== */}
            <SeoIndexationFields
              control={control}
              isBusy={isBusy}
              t={t}
              idPrefix={idPrefix}
              baseUrlIds={baseUrlIds}
              invalidBaseUrl={invalidBaseUrl}
              baseUrlError={baseUrlError}
              canonicalUrlIds={canonicalUrlIds}
              invalidCanonicalUrl={invalidCanonicalUrl}
              canonicalUrlError={canonicalUrlError}
              robotsIds={robotsIds}
              invalidRobots={invalidRobots}
              robotsError={robotsError}
            />

            {/* ===== Twitter ===== */}
            <SeoTwitterFields
              control={control}
              isBusy={isBusy}
              fallbackCard={fallbackCard}
              t={t}
              idPrefix={idPrefix}
            />
          </FormGrid>

          <Separator />

          {/* ===== Open Graph ===== */}
          <FormGrid>
            <SeoOpenGraphFields
              control={control}
              isBusy={isBusy}
              t={t}
              idPrefix={idPrefix}
              onUploadOgImage={onUploadOgImage}
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

SeoForm.displayName = "SeoForm";
