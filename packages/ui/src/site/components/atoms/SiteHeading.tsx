"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteHeading.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : titre sémantique (h1..h6) robuste, avec garde-fous A11y.
 *
 * @remarks
 * - Clamp systématique du niveau (1..6).
 * - Supporte un mode `visuallyHidden` (sr-only).
 * - N’impose aucun style : le skin/template fournit `className`.
 * - Le composant peut rendre un H1 (mais le renderer Markdown Compoz ne génère pas de H1).
 */

import {
  createElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "@compoz/ui/lib/utils";
import { SITE_HEADING } from "@compoz/ui/styles/shared/typography";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type SiteHeadingProps = Readonly<
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
function clampHeading(level: number | undefined): SiteHeadingLevel {
  const n = typeof level === "number" && Number.isFinite(level) ? level : 2;
  const clamped = Math.min(6, Math.max(1, Math.round(n)));
  return clamped as SiteHeadingLevel;
}

/** Retourne le tag HTML correspondant au niveau. */
function getHeadingTag(level: SiteHeadingLevel): HeadingTag {
  return `h${level}` as HeadingTag;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Titre site sémantique (h1..h6).
 */
export function SiteHeading({
  level = 2,
  visuallyHidden = false,
  className,
  children,
  ...rest
}: SiteHeadingProps) {
  const clamped = clampHeading(level);
  const tag = getHeadingTag(clamped);
  const headingClassName = SITE_HEADING[tag] ?? [];

  return createElement(
    tag,
    {
      className: cn(visuallyHidden && "sr-only", headingClassName, className),
      ...rest,
    },
    children,
  );
}

SiteHeading.displayName = "SiteHeading";
