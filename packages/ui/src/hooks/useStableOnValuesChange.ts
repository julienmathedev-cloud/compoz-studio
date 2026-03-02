"use client";

/**
 * @file packages/ui/src/hooks/useStableOnValuesChange.ts
 * @layer hooks/shared
 *
 * @description
 * Hook utilitaire limitant les appels à `onChange` en détectant
 * les changements réels de valeurs via une signature stable.
 *
 * @remarks
 * - Conçu pour être utilisé avec `useWatch()` (RHF).
 * - La sérialisation par défaut est défensive et tolère les valeurs non sérialisables.
 */

import { useEffect, useRef } from "react";

type Serialize<T> = (values: T) => string;

function safeStringify<T>(values: T): string {
  try {
    return JSON.stringify(values ?? ({} as T));
  } catch {
    // Fallback minimal : évite de throw si valeurs circulaires.
    // On garde une signature stable “à peu près” (type + taille de clés si objet).
    if (values && typeof values === "object") {
      const keys = Object.keys(values as Record<string, unknown>);
      return `__unstringifiable_object__:${keys.length}:${keys
        .sort()
        .join(",")}`;
    }
    return `__unstringifiable__:${String(values)}`;
  }
}

export function useStableOnValuesChange<T>(
  values: T,
  onChange?: (values: T) => void,
  serialize: Serialize<T> = safeStringify,
) {
  const lastSigRef = useRef<string>("");

  useEffect(() => {
    if (!onChange) return;

    const sig = serialize(values);

    if (sig === lastSigRef.current) return;

    lastSigRef.current = sig;
    onChange(values);
  }, [values, onChange, serialize]);
}
