/**
 * @file packages/ui/src/lib/getScrollBehavior.ts
 * @layer ui/lib
 * @description Resolves the scroll behavior while respecting reduced-motion preferences.
 * @remarks
 * Returns `auto` during SSR or when media query detection fails.
 */
export function getScrollBehavior(): "auto" | "smooth" {
  if (typeof window === "undefined") return "auto";

  try {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    return mq?.matches ? "auto" : "smooth";
  } catch {
    return "auto";
  }
}
