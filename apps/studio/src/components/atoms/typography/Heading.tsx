/**
 * @file apps/studio/src/components/atoms/typography/Heading.tsx
 * @layer studio/atoms
 *
 * @description
 * Titre générique (h1–h6) avec styles cohérents pour l’interface Studio.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Unifie les styles typographiques via les tokens Studio.
 * - Supporte l’accessibilité (titre masqué visuellement).
 * - Option de troncature sur une ligne.
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import type { HeadingTag } from "@compoz/ui/styles/studio/typography";
import { HEADINGS } from "@compoz/ui/styles/studio/typography";

/**
 * Props du composant `Heading`.
 */
export type HeadingProps = Readonly<{
  as?: HeadingTag;
  visuallyHidden?: boolean;
  truncate?: boolean;
  children: ReactNode;
  className?: string;
}> &
  ComponentPropsWithoutRef<"h2">;

/**
 * Titre typographique standardisé pour le Studio.
 */
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
        visuallyHidden && "sr-only", // titre uniquement pour les aides techniques
        truncate && "truncate", // coupe le texte sur une seule ligne
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

Heading.displayName = "Heading";
