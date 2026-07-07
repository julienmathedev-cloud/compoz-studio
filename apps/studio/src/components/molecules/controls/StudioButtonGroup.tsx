/**
 * @file apps/studio/src/components/molecules/controls/StudioButtonGroup.tsx
 * @layer studio/molecules
 *
 * @description
 * Studio-safe button group compatible with tooltip-style wrappers.
 *
 * @remarks
 * - Wraps the shared `ButtonGroup` while preserving joined-button styling.
 * - Handles direct buttons and wrapped buttons such as `span > button` from disabled `TooltipButton` instances.
 */

import type { ReactNode } from "react";

import { ButtonGroup } from "@compoz/ui/components/ui/button-group";
import { cn } from "@compoz/ui/lib/utils";

export type StudioButtonGroupProps = Readonly<{
  children?: ReactNode;
  className?: string;
}>;

export function StudioButtonGroup({
  children,
  className,
}: StudioButtonGroupProps) {
  return (
    <ButtonGroup
      className={cn(
        // Supports one wrapper level, for example disabled TooltipButton renders span > button.
        "[&>*>*]:rounded-none " +
          "[&>*:first-child>*]:rounded-l-md " +
          "[&>*:last-child>*]:rounded-r-md " +
          "[&>*:not(:first-child)>*]:-ml-px",
        className,
      )}
    >
      {children}
    </ButtonGroup>
  );
}

StudioButtonGroup.displayName = "StudioButtonGroup";
