/**
 * @file packages/ui/src/lib/getScrollBehavior.ts
 * @layer ui/lib
 *
 * @description
 * Détermine la valeur de `scroll-behavior` à appliquer.
 *
 * @remarks
 * - Utilise `matchMedia` pour respecter `prefers-reduced-motion`.
 * - En SSR (window absent) → retourne "auto".
 */

export function getScrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";

  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  return mq?.matches ? "auto" : "smooth";
}
