"use client";

/**
 * @file packages/ui/src/hooks/useStableOnValuesChange.ts
 * @layer ui/hooks
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

function fallbackObjectSignature(values: object): string {
  // Fallback minimal : évite de throw si valeurs circulaires.
  // Signature stable “best-effort” : clés triées + type des valeurs (shallow).
  const entries = Object.entries(values as Record<string, unknown>)
    .map(([k, v]) => `${k}:${typeof v}`)
    .sort();

  return `__unstringifiable_object__:${entries.length}:${entries.join(",")}`;
}

function safeStringify<T>(values: T): string {
  try {
    return JSON.stringify(values ?? ({} as T));
  } catch {
    if (values && typeof values === "object") {
      return fallbackObjectSignature(values as object);
    }
    return `__unstringifiable__:${typeof values}:${String(values)}`;
  }
}

export function useStableOnValuesChange<T>(
  values: T,
  onChange?: (values: T) => void,
  serialize: Serialize<T> = safeStringify,
): void {
  const lastSigRef = useRef<string>("");

  useEffect(() => {
    if (!onChange) return;

    const sig = serialize(values);

    if (sig === lastSigRef.current) return;

    lastSigRef.current = sig;
    onChange(values);
  }, [values, onChange, serialize]);
}
