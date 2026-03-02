"use client";

/**
 * @file apps/studio/src/features/settings/identity/IdentityForm.tsx
 * @layer ui/organisms
 *
 * @description
 * Formulaire d’édition de l’identité (titre, tagline, logo, favicon) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Les groupes Logo/Favicon sont gérés via des composants RHF-aware (`LogoFields`, `FaviconFields`).\n * - La logique “near limit” sur `siteName` / `tagline` est locale à ce formulaire.
 * - Le reset RHF est géré localement puis notifié au parent via `onReset` (optionnel).
 */

import {
  IDENTITY_SITENAME,
  IDENTITY_TAGLINE,
} from "@compoz/core/constants/limits/identity";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import {
  IdentityFormSchema,
  type IdentityFormValues,
} from "@compoz/validation/site/settings/identity/identity-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { FaviconFields } from "@compoz/studio/features/settings/identity/components/molecules/FaviconFields";
import { LogoFields } from "@compoz/studio/features/settings/identity/components/molecules/LogoFields";
import type { IdentityWarningKey } from "@compoz/studio/features/settings/identity/validate";
import { useIdentityUiWarnings } from "@compoz/studio/features/settings/identity/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import type { FieldErrors } from "react-hook-form";
import {
  Controller,
  useController,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

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

  onBlockingErrorsCountChange?: (count: number) => void;

  /** Handler optionnel : remonte l’état dirty (guard / navigation). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

/**
 * Formulaire de configuration de l’identité du site (admin).
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
  const {
    control,
    handleSubmit,
    reset: rhfReset,
    clearErrors,
  } = useForm<IdentityFormValues>({
    resolver: zodResolver(IdentityFormSchema),
    defaultValues: initialValues,
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

  const t = useTranslations();

  // Dirty signal vers le parent (guard / navigation).
  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  // Préfixe stable pour ce formulaire (IDs dérivés : siteName, tagline, favicon, etc.)
  const idPrefix = useIdPrefix("identity-form");

  // IDs pour les champs simples (InputField)
  const siteNameIds = createFieldIds(idPrefix, "siteName");
  const taglineIds = createFieldIds(idPrefix, "tagline");
  const faviconIds = createFieldIds(idPrefix, "faviconUrl");
  // Permet de scroller/focus le champ alt
  const logoAltIds = createFieldIds(idPrefix, "logoAlt");

  /**
   * Resynchronisation : si les valeurs initiales changent (reload côté parent),
   * on remet le formulaire en phase avec `initialValues`.
   */
  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  /**
   * Valeurs RHF live :
   * - utilisées pour les aides "near limit" (siteName/tagline),
   * - pour les warnings d’identité (logoUrl / faviconUrl),
   * - et pour alimenter LogoFields / FaviconFields.
   */
  const watchedValues = useWatch({ control });
  const values: IdentityFormValues = (watchedValues ??
    initialValues) as IdentityFormValues;

  // Aides "near limit" (non bloquantes) sur siteName / tagline.
  const NEAR_THRESHOLD = 10;

  const siteName = values.siteName ?? "";
  const tagline = values.tagline ?? "";

  function getDynamicHelp() {
    const siteNameRemaining = Math.max(
      0,
      IDENTITY_SITENAME.MAX - siteName.length,
    );
    const taglineLen = tagline.length;
    const taglineRemaining = Math.max(0, IDENTITY_TAGLINE.MAX - taglineLen);

    const siteNameHelpDynamic =
      siteNameRemaining <= NEAR_THRESHOLD
        ? t("admin.identityForm.siteName.helpNearLimit", {
            remaining: siteNameRemaining,
          })
        : t("admin.identityForm.siteName.help");

    const taglineHelpDynamic =
      tagline && taglineRemaining <= NEAR_THRESHOLD
        ? t("admin.identityForm.tagline.helpNearLimit", {
            remaining: taglineRemaining,
          })
        : t("admin.identityForm.tagline.help");

    return { siteNameHelpDynamic, taglineHelpDynamic };
  }

  const { siteNameHelpDynamic, taglineHelpDynamic } = getDynamicHelp();

  // Champs RHF dédiés pour les groupes Logo / Favicon.
  const logoAlt = useController({
    name: "logoAlt",
    control,
  });
  const logoUrl = useController({
    name: "logoUrl",
    control,
  });
  const faviconUrl = useController({
    name: "faviconUrl",
    control,
  });

  const showError = isSubmitted || submitCount > 0;

  // Erreurs bloquantes (siteName / logoAlt) : flags invalid + messages lisibles.
  const invalidSiteName =
    (showError || !!touchedFields.siteName) &&
    Boolean(errors.siteName?.message ?? errors.siteName);

  const siteNameErrorMessage =
    (showError || !!touchedFields.siteName) && errors.siteName?.message
      ? String(errors.siteName.message)
      : undefined;

  const hasLogo =
    typeof values.logoUrl === "string" && values.logoUrl.trim() !== "";

  useEffect(() => {
    // Quand le logo disparaît, l'erreur conditionnelle "logoAlt requis si logo"
    // doit disparaître aussi : on la clear explicitement.
    if (!hasLogo) {
      clearErrors("logoAlt");
    }
  }, [hasLogo, clearErrors]);

  const invalidLogoAlt =
    hasLogo &&
    (showError || !!touchedFields.logoAlt) &&
    Boolean(errors.logoAlt?.message ?? errors.logoAlt);

  const logoAltErrorMessage =
    hasLogo && (showError || !!touchedFields.logoAlt) && errors.logoAlt?.message
      ? String(errors.logoAlt.message)
      : undefined;

  // Warnings d’identité (logo / favicon) basés sur les valeurs RHF.
  const warningKeys = useIdentityUiWarnings(values.logoUrl, values.faviconUrl);

  const lastWarningsSigRef = useRef<string>("");

  useEffect(() => {
    if (!onWarningKeysChange) return;
    const sig = warningKeys.join("|");
    if (sig === lastWarningsSigRef.current) return;
    lastWarningsSigRef.current = sig;
    onWarningKeysChange(warningKeys);
  }, [warningKeys, onWarningKeysChange]);

  const blockingErrorsCount = useMemo(() => {
    const invalids = [
      invalidSiteName,
      invalidLogoAlt,
      // plus tard: invalidFoo, invalidBar...
    ];
    return invalids.filter(Boolean).length;
  }, [invalidSiteName, invalidLogoAlt]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  function handleSubmitErrors(formErrors: FieldErrors<IdentityFormValues>) {
    notify.error(t("uiErrors.formHasErrors"));

    const FIELD_PRIORITY: Array<keyof IdentityFormValues> = [
      "siteName",
      "logoAlt",
    ];

    const first = FIELD_PRIORITY.find((k) => {
      if (!formErrors[k]) return false;
      if (k === "logoAlt" && !hasLogo) return false; // évite focus alt si pas de logo
      return true;
    });

    if (!first) return;

    const idByField: Partial<Record<keyof IdentityFormValues, string>> = {
      siteName: siteNameIds.fieldId,
      logoAlt: logoAltIds.fieldId,
    };

    const targetId = idByField[first];
    if (!targetId) return;

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
      onSubmit={handleSubmit(
        (valuesSubmitted) => onSubmit(valuesSubmitted),
        handleSubmitErrors,
      )}
      noValidate
    >
      <Card variant="panel">
        <CardContent className={cn(STACK_MD)}>
          <FormGrid>
            <Controller
              name="siteName"
              control={control}
              render={({ field }) => (
                <InputField
                  ids={siteNameIds}
                  label={t("admin.identityForm.siteName.label")}
                  value={field.value ?? ""}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  placeholder={t("admin.identityForm.siteName.placeholder")}
                  help={siteNameHelpDynamic}
                  required
                  disabled={isBusy}
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
                  label={t("admin.identityForm.tagline.label")}
                  value={field.value ?? ""}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  placeholder={t("admin.identityForm.tagline.placeholder")}
                  help={taglineHelpDynamic}
                  disabled={isBusy}
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
              logoAltField={logoAlt.field}
              logoUrlField={logoUrl.field}
              disabled={isBusy}
              invalidAlt={invalidLogoAlt}
              altErrorMessage={logoAltErrorMessage}
              onUploadLogo={onUploadLogo}
            />

            <FaviconFields
              siteName={values.siteName ?? ""}
              logoAlt={values.logoAlt ?? ""}
              faviconUrlField={faviconUrl.field}
              faviconIds={faviconIds}
              disabled={isBusy}
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
              rhfReset(initialValues, {
                keepDirty: false,
                keepTouched: false,
                keepErrors: false,
              });
              onReset?.();
            }}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

IdentityForm.displayName = "IdentityForm";
