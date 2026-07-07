"use client";

/**
 * @file packages/ui/src/hooks/useIsMounted.tsx
 * @layer ui/hooks
 * @description React hook that reports whether the component has mounted on the client.
 * @remarks
 * Returns `false` during SSR and initial hydration, then `true` after the first client tick.
 */

import { useEffect, useState } from "react";

export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer until after the first client tick to avoid hydration-sensitive reads.
    const id = setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => {
      clearTimeout(id);
    };
  }, []);

  return mounted;
}
