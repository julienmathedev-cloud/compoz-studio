"use client";

/**
 * @file apps/studio/src/components/loading/SectionLoader.tsx
 * @layer studio/components
 *
 * @description
 * Loader de section : affiche un état de chargement uniforme
 * (spinner + label optionnel) avec une hauteur minimale
 * pour limiter le layout shift.
 *
 * @remarks
 * - Composant UI uniquement : aucun fetch, aucune logique métier.
 * - À utiliser au niveau des sections / containers
 *   (ex. `if (isLoading) return <SectionLoader />`).
 */

import type { CSSProperties } from "react";

import { Loader2 } from "lucide-react";

import { cn } from "@compoz/ui/lib/utils";

export type SectionLoaderProps = Readonly<{
  /** Message affiché sous le spinner. */
  label?: string;

  /**
   * Hauteur minimale pour stabiliser le layout.
   * - string : valeur CSS (ex. `"16rem"`)
   * - number : pixels
   */
  minHeight?: string | number;

  /** Classes additionnelles (optionnel). */
  className?: string;
}>;

export function SectionLoader({
  label = "Chargement…",
  minHeight = "16rem",
  className,
}: SectionLoaderProps) {
  const style: CSSProperties =
    typeof minHeight === "number"
      ? { minHeight: `${minHeight}px` }
      : { minHeight };

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-xl border-none bg-card",
        className,
      )}
      style={style}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <Loader2 className="h-5 w-5 motion-safe:animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

SectionLoader.displayName = "SectionLoader";
