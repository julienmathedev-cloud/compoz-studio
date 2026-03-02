"use client";

/**
 * @file apps/studio/src/components/molecules/controls/AddEmptyCardButton.tsx
 * @layer ui/molecules
 *
 * @description
 * Bouton “Empty card” générique pour déclencher une action d’ajout (Plus) avec tooltip.
 *
 * @remarks
 * - Factorise le pattern TooltipButton + EmptyState + styles “empty card”.
 * - Le parent gère la logique (onClick/disabled/tooltip).
 * - UI-only.
 */

import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";

import { cn } from "@compoz/ui/lib/utils";
import { EMPTY_CARD } from "@compoz/ui/styles/studio/layout";

import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";

export type AddEmptyCardButtonProps = Readonly<{
  /** Callback d’action (ex: ajouter un bloc / ajouter un sous-lien). */
  onClick: () => void;

  /** Désactive l’action (busy, permissions…). */
  disabled?: boolean;

  /** Libellé a11y obligatoire. */
  ariaLabel: string;

  /** Tooltip quand le bouton est utilisable. */
  tooltip: string;

  /** Tooltip quand le bouton est désactivé (optionnel). */
  disabledTooltip?: string;

  /** Icône (défaut: Plus). */
  icon?: LucideIcon;

  /** Ajustements UI optionnels. */
  className?: string;

  /** Si tu veux un rendu plus compact (ex: text-xs dans une liste). */
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
      className={cn(
        EMPTY_CARD,
        "flex w-full items-center bg-accent/20 text-left",
        !disabled
          ? "cursor-pointer hover:bg-accent/50 hover:border-primary focus-visible:ring-offset-2"
          : "cursor-not-allowed opacity-70",
        className,
      )}
    >
      <EmptyState icon={Icon} />
    </TooltipButton>
  );
}

AddEmptyCardButton.displayName = "AddEmptyCardButton";
