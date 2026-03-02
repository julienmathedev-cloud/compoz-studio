"use client";

/**
 * @file packages/ui/src/hooks/behaviors/ScrollTopOnRouteChange.tsx
 * @layer public/behaviors
 */

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollTopOnRouteChange() {
  const pathname = usePathname() || "/";

  // ✅ Empêche le navigateur de restaurer automatiquement le scroll
  useEffect(() => {
    try {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
    } catch {
      // noop
    }

    return () => {
      // (optionnel) remettre auto si tu préfères ne pas impacter le reste
      try {
        if ("scrollRestoration" in history) {
          history.scrollRestoration = "auto";
        }
      } catch {
        // noop
      }
    };
  }, []);

  // ✅ Force top à chaque changement de route
  useEffect(() => {
    // double RAF = plus robuste (après layout + paint)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    });
  }, [pathname]);

  return null;
}

ScrollTopOnRouteChange.displayName = "ScrollTopOnRouteChange";
