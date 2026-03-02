"use client";

/**
 * @file packages/ui/src/hooks/useHeaderHeightVar.ts
 * @layer hooks/shared
 *
 * @description
 * Hook utilitaire synchronisant la hauteur d’un header dans une variable CSS.
 *
 * @remarks
 * - Mesure la hauteur via `ResizeObserver`.
 * - Écrit la variable CSS sur la cible configurée.
 * - Retourne une ref à attacher sur l’élément header.
 */

import { useEffect, useRef } from "react";

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
export function useHeaderHeightVar(options?: HeaderHeightVarOptions) {
  const {
    enabled = true,
    varName = "--header-h",
    target = "root",
  } = options ?? {};

  // Ref du header sur lequel mesurer la hauteur
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const headerEl = ref.current;

    // Résolution du “cible” CSS
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
