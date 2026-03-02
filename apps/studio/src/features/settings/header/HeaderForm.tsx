"use client";

/**
 * @file apps/studio/src/features/settings/header/HeaderForm.tsx
 * @layer ui/organisms
 *
 * @description
 * Formulaire d’édition du header (admin) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Peut remonter les valeurs live (`onValuesChange`) pour alimenter une preview draft.
 * - Le reset RHF est géré localement puis notifié au parent via `onReset` (optionnel).
 */

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { useStableOnValuesChange } from "@compoz/ui/hooks/useStableOnValuesChange";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import {
  HeaderFormSchema,
  type HeaderFormValues,
} from "@compoz/validation/site/settings/header/header-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import type { HeaderWarningKey } from "@compoz/studio/features/settings/header/validate";
import { useHeaderUiWarnings } from "@compoz/studio/features/settings/header/validate";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import {
  useController,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";

/**
 * Props du composant `HeaderForm`.
 */
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
    reset: rhfReset,
  } = useForm<HeaderFormValues>({
    resolver: zodResolver(HeaderFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const { isDirty, isSubmitting, errors } = useFormState({ control });

  const isBusy = Boolean(isSaving || isSubmitting);
  const disabledControls = isBusy;

  const t = useTranslations();

  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  const idPrefix = useIdPrefix("header-form");

  const showLogoIds = createFieldIds(idPrefix, "showLogo");
  const showSiteNameIds = createFieldIds(idPrefix, "showSiteName");
  const stickyIds = createFieldIds(idPrefix, "sticky");
  const blurIds = createFieldIds(idPrefix, "blur");
  const swapZonesIds = createFieldIds(idPrefix, "swapPrimaryAndSocial");

  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [initialValues, rhfReset]);

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

  const lastWarningsSigRef = useRef<string>("");

  useEffect(() => {
    if (!onWarningKeysChange) return;

    const sig = warningKeys.join("|");
    if (sig === lastWarningsSigRef.current) return;

    lastWarningsSigRef.current = sig;
    onWarningKeysChange(warningKeys);
  }, [warningKeys, onWarningKeysChange]);

  const watched = useWatch({ control }) as HeaderFormValues | undefined;
  const values = watched ?? initialValues;
  useStableOnValuesChange(values, onValuesChange);

  // ✅ Badge “erreur” : ici ça restera souvent à 0, mais c’est harmonisé.
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
      <Card variant="panel">
        <CardContent>
          <FormGrid>
            <SwitchField
              ids={showLogoIds}
              label={t("admin.headerForm.showLogo.label")}
              help={t("admin.headerForm.showLogo.help")}
              checked={Boolean(showLogoCtrl.field.value)}
              onCheckedChange={(v) => showLogoCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />

            <SwitchField
              ids={showSiteNameIds}
              label={t("admin.headerForm.showSiteName.label")}
              help={t("admin.headerForm.showSiteName.help")}
              checked={Boolean(showSiteNameCtrl.field.value)}
              onCheckedChange={(v) =>
                showSiteNameCtrl.field.onChange(toBool(v))
              }
              disabled={disabledControls}
            />

            <SwitchField
              ids={stickyIds}
              label={t("admin.headerForm.sticky.label")}
              help={t("admin.headerForm.sticky.help")}
              checked={Boolean(stickyCtrl.field.value)}
              onCheckedChange={(v) => stickyCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />

            <SwitchField
              ids={blurIds}
              label={t("admin.headerForm.blur.label")}
              help={t("admin.headerForm.blur.help")}
              checked={Boolean(blurCtrl.field.value)}
              onCheckedChange={(v) => blurCtrl.field.onChange(toBool(v))}
              disabled={disabledControls}
            />

            <SwitchField
              ids={swapZonesIds}
              label={t("admin.headerForm.swapPrimaryAndSocial.label")}
              help={t("admin.headerForm.swapPrimaryAndSocial.help")}
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

HeaderForm.displayName = "HeaderForm";
