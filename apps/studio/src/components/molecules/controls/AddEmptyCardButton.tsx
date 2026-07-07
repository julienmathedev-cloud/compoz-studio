"use client";

/**
 * @file apps/studio/src/components/molecules/controls/AddEmptyCardButton.tsx
 * @layer studio/molecules
 *
 * @description
 * Generic empty-card add button with tooltip support.
 *
 * @remarks
 * - Factorizes the TooltipButton + EmptyState + empty-card styling pattern.
 * - Leaves action, disabled state, and tooltip copy to the parent.
 */

import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";

import { cn } from "@compoz/ui/lib/utils";
import { EMPTY_CARD } from "@compoz/ui/styles/studio/layout";

import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";

export type AddEmptyCardButtonProps = Readonly<{
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  tooltip: string;
  disabledTooltip?: string;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
}>;

export function AddEmptyCardButton({
  onClick,
  disabled = false,
  ariaLabel,
  tooltip,
  disabledTooltip,
  icon: Icon = Plus,
  className,
}: AddEmptyCardButtonProps) {
  return (
    <TooltipButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      tooltip={disabled ? (disabledTooltip ?? tooltip) : tooltip}
      variant="default"
      visualMode="studio"
      className={cn(
        EMPTY_CARD,
        "flex w-full items-center bg-muted/20 text-left",
        !disabled
          ? "cursor-pointer hover:bg-muted/50 hover:border-primary focus-visible:ring-offset-2"
          : "cursor-not-allowed opacity-70",
        className,
      )}
    >
      <EmptyState icon={Icon} />
    </TooltipButton>
  );
}

AddEmptyCardButton.displayName = "AddEmptyCardButton";
