"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/TooltipButton.tsx
 * @layer studio/atoms
 *
 * @description
 * Bouton avec tooltip pour l’interface Studio.
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
import { cn } from "@compoz/ui/lib/utils";

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
 * Bouton standardisé avec tooltip (Studio).
 *
 * @remarks
 * - Si `tooltip` est falsy, rend directement `<Button />`.
 * - Si `disabled`, enveloppe le bouton dans un wrapper focusable pour
 *   permettre l’affichage du tooltip (pattern Radix/ShadCN).
 * - Le wrapper reprend la largeur du parent pour éviter les régressions
 *   de layout sur les boutons `w-full`.
 */
export function TooltipButton({
  tooltip,
  side = "top",
  align = "center",
  delayDuration = 150,
  className,
  ...buttonProps
}: TooltipButtonProps) {
  if (!tooltip) {
    return <Button {...buttonProps} className={className} />;
  }

  const isDisabled = Boolean(buttonProps.disabled);

  const button = <Button {...buttonProps} className={className} />;

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {isDisabled ? (
            <span tabIndex={0} className={cn("flex w-full")}>
              {button}
            </span>
          ) : (
            button
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
