"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/TooltipButton.tsx
 * @layer studio/atoms
 *
 * @description
 * Studio button with tooltip support.
 *
 * @remarks
 * - Wraps `Button` and the ShadCN tooltip components.
 * - Handles the `disabled` case to preserve tooltip accessibility.
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

export type TooltipButtonProps = ComponentProps<typeof Button> &
  Readonly<{
    tooltip?: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    delayDuration?: number;
  }>;

/**
 * Keeps disabled buttons tooltip-accessible without breaking layout-sensitive button widths.
 */
export function TooltipButton({
  tooltip,
  side = "top",
  align = "center",
  delayDuration = 300,
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
            <span tabIndex={0} className={cn("flex")}>
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
