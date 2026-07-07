"use client";

/**
 * @file apps/studio/src/components/molecules/controls/ActionsBar.tsx
 * @layer studio/molecules
 *
 * @description
 * Standard Studio form actions bar for reset, add, and submit controls.
 *
 * @remarks
 * - Centralizes disabled-state computation from `isSaving`, `disabled`, and `isDirty`.
 * - Supports native form submit mode and callback-driven button mode.
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

type Variant = "resetSubmit" | "addResetSubmit" | "submitOnly";

type ActionsBarProps = Readonly<{
  variant?: Variant;
  isSaving?: boolean;
  isDirty?: boolean;
  disabled?: boolean;
  onSubmit?: () => void;
  onReset?: () => void;
  onAdd?: () => void;
  submitType?: "submit" | "button";
  submitLabel?: string;
  submitLoadingLabel?: string;
  resetLabel?: string;
  addLabel?: string;
  submitDisabled?: boolean;
  resetDisabled?: boolean;
  addDisabled?: boolean;
}>;

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
