/**
 * @file apps/studio/src/components/atoms/StudioIcon.tsx
 * @layer studio/atoms
 *
 * @description
 * Standardized decorative icon component for the Studio UI.
 *
 * @remarks
 * - Applies standardized sizing through UI tokens.
 * - Can inherit the parent text color.
 * - Decorative by default with `aria-hidden="true"`.
 */

import type { ComponentType, SVGProps } from "react";

import { cn } from "@compoz/ui/lib/utils";

export type StudioIconProps = Readonly<{
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
}>;

export function StudioIcon({ icon: Icon, className }: StudioIconProps) {
  return <Icon className={cn(className)} aria-hidden="true" />;
}

StudioIcon.displayName = "StudioIcon";
