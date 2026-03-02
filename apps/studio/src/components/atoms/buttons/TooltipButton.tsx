"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/TooltipButton.tsx
 * @layer ui/atoms
 *
 * @description
 * Bouton avec tooltip pour l’interface d’administration.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Wrapper autour de `Button` et des composants tooltip (ShadCN).
 * - Gère le cas `disabled` pour préserver l’accessibilité du tooltip.
 */

import type { ComponentProps, ReactNode } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@compoz/ui/components/ui/tooltip";

/**
 * Props du composant `TooltipButton`.
 */
export type TooltipButtonProps = ComponentProps<typeof Button> &
  Readonly<{
    /** Contenu du tooltip. */
    tooltip?: ReactNode;
    /** Position du tooltip. */
    side?: "top" | "right" | "bottom" | "left";
    /** Alignement du tooltip. */
    align?: "start" | "center" | "end";
    /** Délai d’affichage du tooltip (ms). */
    delayDuration?: number;
  }>;

/**
 * Bouton standardisé avec tooltip (admin).
 */
export function TooltipButton({
  tooltip,
  side = "top",
  align = "center",
  delayDuration = 150,
  ...buttonProps
}: TooltipButtonProps) {
  // Si aucun tooltip (rare), on rend juste le bouton.
  if (!tooltip) {
    return <Button {...buttonProps} />;
  }

  const isDisabled = Boolean(buttonProps.disabled);

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {isDisabled ? (
            <span tabIndex={0} className="inline-flex">
              <Button {...buttonProps} />
            </span>
          ) : (
            <Button {...buttonProps} />
          )}
        </TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

TooltipButton.displayName = "TooltipButton";
