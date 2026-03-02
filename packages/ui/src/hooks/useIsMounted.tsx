"use client";
/**
 * @file packages/ui/src/hooks/useIsMounted.tsx
 * @layer hooks/admin
 *
 * @description
 * Hook React indiquant si le composant est monté côté client.
 *
 * @remarks
 * - Retourne `false` pendant le SSR et la première hydratation.
 * - Passe à `true` après le premier tick côté client.
 * - Strictement UI-only.
 */
import { useEffect, useState } from "react";

/**
 * Indique si le composant est monté côté client.
 *
 * @returns `true` une fois le composant monté côté client, sinon `false`.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // On décale la mise à jour dans une tâche asynchrone
    const id = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(id);
    };
  }, []);

  return mounted;
}
