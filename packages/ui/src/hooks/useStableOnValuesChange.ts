"use client";

/**
 * @file packages/ui/src/hooks/useStableOnValuesChange.ts
 * @layer ui/hooks
 * @description Calls `onChange` only when watched values produce a new stable signature.
 * @remarks
 * Designed for React Hook Form `useWatch()` values; the default serializer is defensive against non-serializable values.
 */

import { useEffect, useRef } from "react";

type Serialize<T> = (values: T) => string;

function fallbackObjectSignature(values: object): string {
  // Best-effort shallow signature for circular or otherwise unserializable objects.
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
