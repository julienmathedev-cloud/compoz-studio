"use client";

/**
 * @file apps/studio/src/components/loading/SectionLoader.tsx
 * @layer ui/components
 *
 * @description
 * Loader de section : affiche un état de chargement uniforme (spinner + label optionnel)
 * avec une hauteur minimale pour limiter le layout shift.
 *
 * @remarks
 * - UI-only : aucun fetch, aucune logique métier.
 * - À utiliser au niveau des sections/containers (ex. `if (isLoading) return <SectionLoader />`).
 */

import { Loader2 } from "lucide-react";
import { type CSSProperties, useMemo } from "react";

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
  const style = useMemo<CSSProperties>(() => {
    if (typeof minHeight === "number") return { minHeight: `${minHeight}px` };
    return { minHeight };
  }, [minHeight]);

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
