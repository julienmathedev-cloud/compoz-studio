"use client";

/**
 * @file apps/studio/src/components/atoms/typography/HelpText.tsx
 * @layer ui/atoms
 *
 * @description
 * Texte d’aide standardisé pour l’interface d’administration.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Wrapper fin autour de `Text` avec le variant `meta`.
 * - Utilisé pour les descriptions et aides contextuelles.
 */

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import type { HTMLAttributes, ReactNode } from "react";

/**
 * Props du composant `HelpText`.
 */
export type HelpTextProps = Readonly<{
  as?: "p" | "span";
  children: ReactNode;
}> &
  HTMLAttributes<HTMLElement>;

/**
 * Affiche un texte d’aide contextuel (admin).
 */
export function HelpText({ as = "p", children, ...rest }: HelpTextProps) {
  return (
    <Text as={as} variant="meta" {...rest}>
      {children}
    </Text>
  );
}

HelpText.displayName = "HelpText";
