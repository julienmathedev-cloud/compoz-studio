/**
 * @file apps/studio/src/lib/focus.ts
 * @layer lib/ui
 * @description
 * Helpers UI liés au focus/scroll sur des champs (DOM).
 */

import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";

/**
 * Scroll vers un élément par id et tente de le focus.
 *
 * @remarks
 * - UI only (DOM).
 * - Le timeout laisse le temps au scroll/paint avant le focus.
 */
export function focusByFieldId(fieldId?: string): void {
  if (!fieldId) return;
  if (typeof document === "undefined") return;

  const el = document.getElementById(fieldId) as HTMLElement | null;
  if (!el) return;

  el.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
  setTimeout(() => el.focus?.(), 50);
}
