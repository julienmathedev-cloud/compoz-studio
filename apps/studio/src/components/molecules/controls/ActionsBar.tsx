"use client";

/**
 * @file apps/studio/src/components/molecules/controls/ActionsBar.tsx
 * @layer studio/molecules
 *
 * @description
 * Barre d’actions (Studio) pour formulaires : Reset / Add / Submit, avec états et tooltips.
 *
 * @remarks
 * - Molecule UI : compose des atoms (`TooltipButton`, `LoadingStatus`, `StudioIcon`) et des layouts (`StudioButtonGroup`).
 * - Centralise le calcul des états `disabled` à partir de `isSaving`, `disabled` et `isDirty`.
 * - Peut fonctionner en mode `<form onSubmit>` (`submitType="submit"`) ou via callback (`submitType="button"`).
 * - Strictement UI-only : aucune logique métier.
 */

import { Plus, RotateCcw, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { Spinner } from "@compoz/ui/components/ui/spinner";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN, ROW_END } from "@compoz/ui/styles/studio/layout";

import { LoadingStatus } from "@compoz/studio/components/atoms/LoadingStatus";
import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { StudioButtonGroup } from "@compoz/studio/components/molecules/controls/StudioButtonGroup";

/**
 * Variantes d’affichage de la barre d’actions.
 */
type Variant = "resetSubmit" | "addResetSubmit" | "submitOnly";

/**
 * Props du composant `ActionsBar`.
 */
type ActionsBarProps = Readonly<{
  /** Contrôle la disposition des boutons. */
  variant?: Variant;

  /** Indique qu’une sauvegarde est en cours. */
  isSaving?: boolean;

  /** Indique si le formulaire contient des changements non sauvegardés. */
  isDirty?: boolean;

  /** Désactive explicitement toute la barre d’actions. */
  disabled?: boolean;

  /** Callback submit (utilisé si `submitType="button"`). */
  onSubmit?: () => void;

  /** Callback reset. */
  onReset?: () => void;

  /** Callback ajouter. */
  onAdd?: () => void;

  /** Type HTML du bouton submit (`submit` par défaut). */
  submitType?: "submit" | "button";

  /** Libellé du bouton submit (fallback i18n). */
  submitLabel?: string;

  /** Libellé submit pendant la sauvegarde (fallback i18n). */
  submitLoadingLabel?: string;

  /** Libellé du bouton reset (fallback i18n). */
  resetLabel?: string;

  /** Libellé du bouton ajouter (fallback i18n). */
  addLabel?: string;

  /** Override `disabled` du bouton submit. */
  submitDisabled?: boolean;
  /** Override `disabled` du bouton reset. */
  resetDisabled?: boolean;
  /** Override `disabled` du bouton ajouter. */
  addDisabled?: boolean;
}>;

/**
 * Barre d’actions standardisée pour formulaires (Studio).
 */
export function ActionsBar({
  variant = "resetSubmit",
  isSaving = false,
  isDirty,
  disabled = false,

  onSubmit,
  onReset,
  onAdd,

  submitType = "submit",

  submitLabel,
  submitLoadingLabel,
  resetLabel,
  addLabel,

  submitDisabled,
  resetDisabled,
  addDisabled,
}: ActionsBarProps) {
  const t = useTranslations();

  const baseDisabled = disabled || isSaving;

  const computedSubmitDisabled =
    submitDisabled ??
    (baseDisabled || (isDirty === undefined ? false : !isDirty));

  const computedResetDisabled =
    resetDisabled ??
    (baseDisabled || (isDirty === undefined ? false : !isDirty));

  const computedAddDisabled = addDisabled ?? baseDisabled;

  const submitText = isSaving
    ? (submitLoadingLabel ?? t("common.saving"))
    : (submitLabel ?? t("common.save"));

  const resetText = resetLabel ?? t("common.reset");
  const addText = addLabel ?? t("common.add");

  const submitDisabledTooltip = isSaving
    ? t("common.saving")
    : isDirty === false
      ? t("studio.actionsBar.noChangesToSave")
      : t("common.actionUnavailable");

  const resetDisabledTooltip = isSaving
    ? t("common.saving")
    : isDirty === false
      ? t("studio.actionsBar.noChangesToReset")
      : t("common.actionUnavailable");

  const addDisabledTooltip = isSaving
    ? t("common.saving")
    : t("common.actionUnavailable");

  return (
    <div className={cn("w-full")} aria-busy={isSaving || undefined}>
      {isSaving && (
        <LoadingStatus
          label={t("common.saving")}
          withSpinner={false}
          className="sr-only"
        />
      )}

      {variant === "addResetSubmit" ? (
        <div className={cn(ROW_BETWEEN, "w-full")}>
          <TooltipButton
            type="button"
            variant="outline"
            visualMode="studio"
            size="lg"
            onClick={onAdd}
            disabled={computedAddDisabled}
            tooltip={computedAddDisabled ? addDisabledTooltip : addText}
            aria-label={addText}
          >
            <Plus />
          </TooltipButton>

          <StudioButtonGroup className="flex">
            <TooltipButton
              type="button"
              variant="ghost"
              visualMode="studio"
              size="lg"
              onPointerDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReset?.();
              }}
              disabled={computedResetDisabled}
              tooltip={computedResetDisabled ? resetDisabledTooltip : resetText}
              aria-label={resetText}
            >
              <RotateCcw />
            </TooltipButton>

            <TooltipButton
              size="lg"
              type={submitType}
              variant="default"
              visualMode="studio"
              onClick={submitType === "button" ? onSubmit : undefined}
              disabled={computedSubmitDisabled}
              tooltip={
                computedSubmitDisabled ? submitDisabledTooltip : submitText
              }
              aria-label={submitText}
            >
              {isSaving ? (
                <StudioIcon
                  icon={Spinner}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Save />
              )}
            </TooltipButton>
          </StudioButtonGroup>
        </div>
      ) : variant === "submitOnly" ? (
        <div className={cn(ROW_END)}>
          <TooltipButton
            size="lg"
            type={submitType}
            variant="default"
            visualMode="studio"
            onClick={submitType === "button" ? onSubmit : undefined}
            disabled={computedSubmitDisabled}
            tooltip={
              computedSubmitDisabled ? submitDisabledTooltip : submitText
            }
            aria-label={submitText}
          >
            {isSaving ? (
              <StudioIcon icon={Spinner} className="motion-safe:animate-spin" />
            ) : (
              <Save />
            )}
          </TooltipButton>
        </div>
      ) : (
        <div className={cn(ROW_END)}>
          <StudioButtonGroup>
            <TooltipButton
              type="button"
              variant="ghost"
              visualMode="studio"
              size="lg"
              onPointerDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReset?.();
              }}
              disabled={computedResetDisabled}
              tooltip={computedResetDisabled ? resetDisabledTooltip : resetText}
              aria-label={resetText}
            >
              <RotateCcw />
            </TooltipButton>

            <TooltipButton
              type={submitType}
              variant="default"
              visualMode="studio"
              onClick={submitType === "button" ? onSubmit : undefined}
              disabled={computedSubmitDisabled}
              size="lg"
              tooltip={
                computedSubmitDisabled ? submitDisabledTooltip : submitText
              }
              aria-label={submitText}
            >
              {isSaving ? (
                <StudioIcon
                  icon={Spinner}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Save />
              )}
            </TooltipButton>
          </StudioButtonGroup>
        </div>
      )}
    </div>
  );
}

ActionsBar.displayName = "ActionsBar";
