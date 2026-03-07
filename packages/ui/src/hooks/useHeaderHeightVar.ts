"use client";

/**
 * @file packages/ui/src/hooks/useHeaderHeightVar.ts
 * @layer ui/hooks
 *
 * @description
 * Hook utilitaire synchronisant la hauteur d’un header dans une variable CSS.
 *
 * @remarks
 * - Mesure la hauteur via `ResizeObserver` (si disponible).
 * - Écrit la variable CSS sur la cible configurée.
 * - Retourne une ref à attacher sur l’élément header.
 */

import { useEffect, useRef, type RefObject } from "react";

/**
 * Options de configuration de la variable CSS de hauteur du header.
 */
type HeaderHeightVarOptions =
  | { enabled?: boolean; varName?: string; target?: "root" }
  | { enabled?: boolean; varName?: string; target: "element" }
  | { enabled?: boolean; varName?: string; target: HTMLElement | null };

/**
 * Expose une ref permettant de synchroniser la hauteur du header
 * dans une variable CSS lorsque le hook est activé.
 */
export function useHeaderHeightVar(
  options?: HeaderHeightVarOptions,
): RefObject<HTMLElement | null> {
  const {
    enabled = true,
    varName = "--header-h",
    target = "root",
  } = options ?? {};

  // Ref du header sur lequel mesurer la hauteur
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === "undefined") return;

    const headerEl = ref.current;
    if (!headerEl) return;

    // Résolution de la “cible” CSS
    const styleTarget =
      target === "root"
        ? document.documentElement
        : target === "element"
          ? headerEl
          : target || document.documentElement;

    // Applique la hauteur actuelle dans la variable CSS
    const apply = () => {
      const h = Math.round(headerEl.getBoundingClientRect().height);
      styleTarget.style.setProperty(varName, `${h}px`);
    };

    apply();

    // Fallback (tests / env sans ResizeObserver) : on applique une fois et on sort.
    if (typeof ResizeObserver === "undefined") {
      return () => {
        // Nettoyage uniquement si on a écrit sur un élément différent de root
        if (styleTarget !== document.documentElement) {
          styleTarget.style.removeProperty(varName);
        }
      };
    }

    // Observe les changements de hauteur du header
    const ro = new ResizeObserver(apply);
    ro.observe(headerEl);

    return () => {
      ro.disconnect();
      // Nettoyage uniquement si on a écrit sur un élément différent de root
      if (styleTarget !== document.documentElement) {
        styleTarget.style.removeProperty(varName);
      }
    };
  }, [enabled, varName, target]);

  return ref;
}
