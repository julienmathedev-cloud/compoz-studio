/**
 * @file apps/studio/src/components/atoms/typography/Text.tsx
 * @layer studio/atoms
 *
 * @description
 * Texte générique (paragraphe / inline) avec variantes typographiques pour le Studio.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Unifie les styles typographiques via les tokens Studio.
 * - Supporte l’accessibilité (texte masqué visuellement).
 * - Supporte la troncature sur une ligne.
 */

import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import {
  TEXT_VARIANT_STYLES,
  type TextVariant,
} from "@compoz/ui/styles/studio/typography";

/**
 * Balises HTML supportées pour le composant `Text`.
 */
export type TextTag = "p" | "span" | "li" | "label" | "small";

/**
 * Props du composant `Text`.
 */
export type TextProps = Omit<HTMLAttributes<HTMLElement>, "className"> &
  Readonly<{
    as?: TextTag;
    variant?: TextVariant;
    visuallyHidden?: boolean;
    truncate?: boolean;
    className?: string;
    children: ReactNode;
  }>;

/**
 * Texte typographique standardisé pour l’interface Studio.
 */
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
        // Style typographique de base (taille, poids, couleur par défaut)
        TEXT_VARIANT_STYLES[variant],
        // Utilitaires d’accessibilité / mise en forme
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
