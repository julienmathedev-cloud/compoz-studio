/**
 * @file packages/ui/src/lib/focus.ts
 * @layer ui/lib/focus
 * @description DOM focus helper for scrolling to fields and applying focus after paint.
 */

import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";

export function focusByFieldId(fieldId?: string): void {
  if (!fieldId) return;
  if (typeof document === "undefined") return;

  const el = document.getElementById(fieldId);
  if (!el) return;

  el.scrollIntoView({
    behavior: getScrollBehavior(),
    block: "center",
  });

  // Wait for scroll and paint before focusing without triggering another scroll.
  setTimeout(() => {
    el.focus?.({ preventScroll: true });
  }, 50);
}
