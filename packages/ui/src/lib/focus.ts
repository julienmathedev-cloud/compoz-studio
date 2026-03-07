/**
 * @file apps/studio/src/lib/focus.ts
 * @layer ui/lib/focus
 * @description
 * Helpers UI liés au focus/scroll sur des champs (DOM).
 */

import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";

/**
 * Scroll vers un élément par id et tente de lui donner le focus.
 *
 * @remarks
 * - UI only (DOM).
 * - Utilisé typiquement pour amener l'utilisateur sur un champ en erreur.
 * - Un court timeout laisse le temps au scroll/paint avant d'appliquer le focus.
 */
export function focusByFieldId(fieldId?: string): void {
  if (!fieldId) return;
  if (typeof document === "undefined") return;

  const el = document.getElementById(fieldId);
  if (!el) return;

  el.scrollIntoView({
    behavior: getScrollBehavior(),
    block: "center",
  });

  // On laisse le temps au scroll/paint avant de focus
  setTimeout(() => {
    el.focus?.({ preventScroll: true });
  }, 50);
}
