"use client";

/**
 * @file packages/ui/src/hooks/behaviors/ScrollTopOnRouteChange.tsx
 * @layer ui/hooks/behaviors
 * @description
 * Force le scroll en haut à chaque changement de route (Next App Router).
 *
 * @remarks
 * - UI-only (DOM).
 * - Désactive la restauration automatique du scroll du navigateur via `history.scrollRestoration`.
 * - Prévu pour être utilisé avec des `Link` internes configurés avec `scroll={false}`.
 * - Le scroll top inter-page doit rester immédiat, même si le site utilise
 *   un `scroll-behavior: smooth` pour les ancres intra-page.
 * - Si un conteneur `[data-scroll-root]` existe, il est utilisé comme racine de scroll.
 * - Sinon, fallback sur `window` / `document.documentElement`.
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type ScrollRoot = Window | HTMLElement;

/**
 * Résout la racine de scroll principale de la page.
 *
 * @returns
 * - le conteneur `[data-scroll-root]` s’il existe ;
 * - sinon `window`.
 */
function getScrollRoot(): ScrollRoot {
  if (typeof document === "undefined") {
    return window;
  }

  const root = document.querySelector<HTMLElement>("[data-scroll-root]");
  return root ?? window;
}

/**
 * Indique si la racine de scroll est `window`.
 */
function isWindowScrollRoot(root: ScrollRoot): root is Window {
  return typeof Window !== "undefined" && root instanceof Window;
}

/**
 * Retourne l’élément DOM portant réellement le `scroll-behavior`
 * pour la racine de scroll courante.
 *
 * @remarks
 * - Pour `window`, le comportement est porté par `document.documentElement`.
 * - Pour un conteneur custom, c’est l’élément lui-même.
 */
function getScrollBehaviorTarget(root: ScrollRoot): HTMLElement | null {
  if (typeof document === "undefined") return null;

  if (isWindowScrollRoot(root)) {
    return document.documentElement;
  }

  return root;
}

/**
 * Scrolle immédiatement la racine résolue en haut de page.
 *
 * @remarks
 * - Désactive temporairement `scroll-behavior: smooth` sur la vraie racine
 *   afin de garantir un scroll inter-page sec.
 * - Les ancres intra-page continuent, elles, à bénéficier du smooth global.
 */
function scrollRootToTopImmediate(): void {
  if (typeof window === "undefined") return;

  const root = getScrollRoot();
  const behaviorTarget = getScrollBehaviorTarget(root);
  const previousInlineScrollBehavior =
    behaviorTarget?.style.scrollBehavior ?? "";

  if (behaviorTarget) {
    behaviorTarget.style.scrollBehavior = "auto";
  }

  if (isWindowScrollRoot(root)) {
    root.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } else {
    root.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    root.scrollTop = 0;
  }

  /**
   * Restaure le comportement après le scroll courant.
   *
   * @remarks
   * On utilise un RAF pour laisser le navigateur appliquer le repositionnement
   * avant de réactiver le smooth pour les futures ancres.
   */
  window.requestAnimationFrame(() => {
    if (!behaviorTarget) return;

    if (previousInlineScrollBehavior) {
      behaviorTarget.style.scrollBehavior = previousInlineScrollBehavior;
      return;
    }

    behaviorTarget.style.removeProperty("scroll-behavior");
  });
}

export function ScrollTopOnRouteChange() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  /**
   * Signature de navigation :
   * inclut le pathname et la querystring pour couvrir aussi
   * les navigations qui changent seulement les search params.
   */
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  /**
   * Empêche le navigateur de restaurer automatiquement le scroll.
   */
  useEffect(() => {
    if (typeof history === "undefined") return;

    try {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
    } catch {
      // noop
    }

    return () => {
      try {
        if ("scrollRestoration" in history) {
          history.scrollRestoration = "auto";
        }
      } catch {
        // noop
      }
    };
  }, []);

  /**
   * Force le scroll top après navigation.
   *
   * @remarks
   * - Utilise un double `requestAnimationFrame` pour laisser le layout se stabiliser.
   * - Le scroll inter-page reste volontairement immédiat.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timeoutId = window.setTimeout(() => {
      const raf1 = window.requestAnimationFrame(() => {
        const raf2 = window.requestAnimationFrame(() => {
          scrollRootToTopImmediate();
        });

        void raf2;
      });

      void raf1;
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [routeKey]);

  return null;
}

ScrollTopOnRouteChange.displayName = "ScrollTopOnRouteChange";
