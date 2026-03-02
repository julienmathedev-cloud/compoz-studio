"use client";

/**
 * @file packages/ui/src/site/components/atoms/PublicHeading.tsx
 * @layer ui/public/atoms
 *
 * @description
 * Atome public : titre sémantique (h1..h6) robuste, avec garde-fous A11y.
 *
 * @remarks
 * - Clamp systématique du niveau (1..6).
 * - Supporte un mode `visuallyHidden` (sr-only) tout en exigeant un texte non vide.
 * - N’impose aucun style : le skin/template fournit `className`.
 * - Le composant peut rendre un H1 (mais le renderer Markdown Compoz ne génère pas de H1).
 */

import {
  createElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "@compoz/ui/lib/utils";
import { PUBLIC_HEADING } from "@compoz/ui/styles/shared/typography";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PublicHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type PublicHeadingProps = Readonly<
  Omit<ComponentPropsWithoutRef<"h2">, "children"> & {
    /** Niveau souhaité (clampé 1..6). */
    level?: number;

    /** Masque visuellement le titre (reste lisible par SR). */
    visuallyHidden?: boolean;

    /** Contenu du titre. */
    children: ReactNode;

    /** Classes injectées par skin/template. */
    className?: string;
  }
>;

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

/** Clamp un niveau heading dans [1..6]. */
function clampHeading(level: number | undefined): PublicHeadingLevel {
  const n = typeof level === "number" && Number.isFinite(level) ? level : 2;
  const clamped = Math.min(6, Math.max(1, Math.round(n)));
  return clamped as PublicHeadingLevel;
}

/** Retourne le tag HTML correspondant au niveau. */
function getHeadingTag(level: PublicHeadingLevel): HeadingTag {
  return `h${level}` as HeadingTag;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Titre public sémantique (h1..h6).
 */
export function PublicHeading({
  level = 2,
  visuallyHidden = false,
  className,
  children,
  ...rest
}: PublicHeadingProps) {
  const clamped = clampHeading(level);
  const tag = getHeadingTag(clamped);
  const headingClassName = PUBLIC_HEADING[tag] ?? [];

  return createElement(
    tag,
    {
      className: cn(visuallyHidden && "sr-only", headingClassName, className),
      ...rest,
    },
    children,
  );
}

PublicHeading.displayName = "PublicHeading";
