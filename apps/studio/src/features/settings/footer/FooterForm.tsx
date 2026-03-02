"use client";

/**
 * @file apps/studio/src/features/settings/footer/FooterForm.tsx
 * @layer ui/organisms
 *
 * @description
 * Formulaire d’édition du footer (admin) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Peut remonter les valeurs live (`onValuesChange`) pour alimenter une preview draft.
 * - Le reset RHF est géré localement puis notifié au parent via `onReset` (optionnel).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import {
  useController,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { useStableOnValuesChange } from "@compoz/ui/hooks/useStableOnValuesChange";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import {
  FooterFormSchema,
  type FooterFormValues,
} from "@compoz/validation/site/settings/footer/footer-form";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import type { FooterWarningKey } from "@compoz/studio/features/settings/footer/validate";
import { useFooterUiWarnings } from "@compoz/studio/features/settings/footer/validate";
import { useTranslations } from "next-intl";

/**
 * Props du composant `FooterForm`.
 */
type FooterFormProps = Readonly<{
  /** Valeurs initiales (baseline) fournies par la section. */
  initialValues: FooterFormValues;

  /** Indique qu’une sauvegarde côté parent est en cours. */
  isSaving?: boolean;

  /** Callback appelé avec des valeurs validées par Zod. */
  onSubmit: (values: FooterFormValues) => void | Promise<void>;

  /** Handler optionnel : permet au parent de réagir à un reset UI. */
  onReset?: () => void;

  /** Handler optionnel : remonte les warnings UI (non bloquants). */
  onWarningKeysChange?: (keys: FooterWarningKey[]) => void;

  /** Handler optionnel : remonte les valeurs live (preview draft). */
  onValuesChange?: (values: FooterFormValues) => void;

  /** Handler optionnel : remonte le nombre d’erreurs bloquantes (badges section). */
  onBlockingErrorsCountChange?: (count: number) => void;

  /** Handler optionnel : remonte l’état dirty (guard / navigation). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

/**
 * Formulaire de configuration du pied de page (admin).
 */
export function FooterForm({
  initialValues,
  isSaving,
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
    reset: rhfReset,
  } = useForm<FooterFormValues>({
    resolver: zodResolver(FooterFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  // ✅ Source fiable pour rerender sur errors/touched/submit.
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

  const t = useTranslations();

  // Dirty signal vers le parent (guard / navigation).
  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  // Préfixe d’ID stable pour ce formulaire
  const idPrefix = useIdPrefix("footer-form");

  // IDs de champs dérivés du préfixe
  const showYearIds = createFieldIds(idPrefix, "showYear");
  const copyrightIds = createFieldIds(idPrefix, "copyright");

  /**
   * Resync RHF quand la baseline parent change.
   */
  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

  /**
   * RHF controllers (Identity-style).
   */
  const showYearCtrl = useController({ name: "showYear", control });
  const copyrightCtrl = useController({ name: "copyright", control });

  /**
   * Warnings live basés sur les valeurs RHF.
   */
  const [showYearWatch, copyrightWatch] = useWatch({
    control,
    name: ["showYear", "copyright"],
  });

  // Preview draft (valeurs live).
  const watched = useWatch({ control }) as FooterFormValues | undefined;
  const values = watched ?? initialValues;
  useStableOnValuesChange(values, onValuesChange);

  const warningKeys = useFooterUiWarnings(
    copyrightWatch,
    Boolean(showYearWatch),
  );

  const lastWarningsSigRef = useRef<string>("");

  useEffect(() => {
    if (!onWarningKeysChange) return;
    const sig = warningKeys.join("|");
    if (sig === lastWarningsSigRef.current) return;
    lastWarningsSigRef.current = sig;
    onWarningKeysChange(warningKeys);
  }, [warningKeys, onWarningKeysChange]);

  /**
   * Affichage d’erreur UX : Identity-style.
   */
  const showError = isSubmitted || submitCount > 0;

  const invalidCopyright =
    (showError || Boolean(touchedFields.copyright)) &&
    Boolean(errors.copyright?.message ?? errors.copyright);

  const copyrightError =
    (showError || Boolean(touchedFields.copyright)) && errors.copyright?.message
      ? String(errors.copyright.message)
      : undefined;

  // ✅ Compteur erreurs bloquantes (pour badge de section).
  const blockingErrorsCount = useMemo(() => {
    return [invalidCopyright].filter(Boolean).length;
  }, [invalidCopyright]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  /**
   * Helper : cast strict vers boolean.
   */
  const toBool = (v: boolean | "indeterminate") => v === true;

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Card variant="panel">
        <CardContent>
          <FormGrid>
            <InputField
              ids={copyrightIds}
              label={t("admin.footerForm.copyright.label")}
              help={t("admin.footerForm.copyright.help")}
              value={String(copyrightCtrl.field.value ?? "")}
              onChange={(v) => copyrightCtrl.field.onChange(v)}
              onBlur={copyrightCtrl.field.onBlur}
              placeholder={t("admin.footerForm.copyright.placeholder")}
              disabled={disabledControls}
              autoCapitalize="sentences"
              autoCorrect="on"
              invalid={invalidCopyright}
              error={copyrightError}
            />

            <SwitchField
              ids={showYearIds}
              label={t("admin.footerForm.showYear.label")}
              help={t("admin.footerForm.showYear.help")}
              checked={Boolean(showYearCtrl.field.value)}
              onCheckedChange={(v) => showYearCtrl.field.onChange(toBool(v))}
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

FooterForm.displayName = "FooterForm";
