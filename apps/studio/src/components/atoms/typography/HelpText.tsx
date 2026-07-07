/**
 * @file apps/studio/src/components/atoms/typography/HelpText.tsx
 * @layer studio/atoms
 *
 * @description
 * Standardized contextual help text for the Studio UI.
 *
 * @remarks
 * - Thin wrapper around `Text` using the `meta` variant.
 */

import type { HTMLAttributes, ReactNode } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";

export type HelpTextProps = Readonly<{
  as?: "p" | "span";
  children: ReactNode;
}> &
  HTMLAttributes<HTMLElement>;

export function HelpText({ as = "p", children, ...rest }: HelpTextProps) {
  return (
    <Text as={as} variant="meta" {...rest}>
      {children}
    </Text>
  );
}

HelpText.displayName = "HelpText";
