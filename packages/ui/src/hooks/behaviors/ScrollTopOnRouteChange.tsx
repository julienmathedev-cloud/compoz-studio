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
 */

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";

export function ScrollTopOnRouteChange() {
  const pathname = usePathname() || "/";

  // Empêche le navigateur de restaurer automatiquement le scroll
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

  // Force top à chaque changement de route
  useEffect(() => {
    if (typeof window === "undefined") return;

    // double RAF = plus robuste (après layout + paint)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: getScrollBehavior() });
      });
    });
  }, [pathname]);

  return null;
}

ScrollTopOnRouteChange.displayName = "ScrollTopOnRouteChange";
