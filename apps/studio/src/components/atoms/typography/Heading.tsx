/**
 * @file apps/studio/src/components/atoms/typography/Heading.tsx
 * @layer studio/atoms
 *
 * @description
 * Generic heading component with consistent h1–h6 styles for the Studio UI.
 *
 * @remarks
 * - Unifies typography styles through Studio tokens.
 * - Supports accessible visually hidden headings and single-line truncation.
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import type { HeadingTag } from "@compoz/ui/styles/studio/typography";
import { HEADINGS } from "@compoz/ui/styles/studio/typography";

export type HeadingProps = Readonly<{
  as?: HeadingTag;
  visuallyHidden?: boolean;
  truncate?: boolean;
  children: ReactNode;
  className?: string;
}> &
  ComponentPropsWithoutRef<"h2">;

export function Heading({
  as = "h2",
  visuallyHidden = false,
  truncate = false,
  children,
  className,
  ...rest
}: HeadingProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        HEADINGS[as],
        visuallyHidden && "sr-only",
        truncate && "truncate",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

Heading.displayName = "Heading";
