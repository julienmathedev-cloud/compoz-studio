/**
 * @file apps/studio/src/components/atoms/typography/Text.tsx
 * @layer studio/atoms
 *
 * @description
 * Generic paragraph/inline text component with Studio typography variants.
 *
 * @remarks
 * - Unifies typography styles through Studio tokens.
 * - Supports accessible visually hidden text and single-line truncation.
 */

import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import {
  TEXT_VARIANT_STYLES,
  type TextVariant,
} from "@compoz/ui/styles/studio/typography";

export type TextTag = "p" | "span" | "li" | "label" | "small";

export type TextProps = Omit<HTMLAttributes<HTMLElement>, "className"> &
  Readonly<{
    as?: TextTag;
    variant?: TextVariant;
    visuallyHidden?: boolean;
    truncate?: boolean;
    className?: string;
    children: ReactNode;
  }>;

export function Text({
  as = "p",
  variant = "base",
  visuallyHidden = false,
  truncate = false,
  children,
  className,
  ...rest
}: TextProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        TEXT_VARIANT_STYLES[variant],
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

Text.displayName = "Text";
