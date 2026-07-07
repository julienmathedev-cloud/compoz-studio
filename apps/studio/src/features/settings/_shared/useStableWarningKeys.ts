"use client";

/**
 * @file apps/studio/src/features/settings/_shared/useStableWarningKeys.ts
 * @layer studio/features/settings/shared
 *
 * @description
 * Reports warning keys only when their stable signature changes.
 *
 * @remarks
 * - Prevents repeated parent notifications when warning arrays are re-created with the same content.
 */

import { useEffect, useRef } from "react";

type UseStableWarningKeysParams<TWarningKey extends string> = Readonly<{
  warningKeys: readonly TWarningKey[];
  onWarningKeysChange?: (keys: TWarningKey[]) => void;
}>;

export function useStableWarningKeys<TWarningKey extends string>({
  warningKeys,
  onWarningKeysChange,
}: UseStableWarningKeysParams<TWarningKey>) {
  const lastWarningsSigRef = useRef<string>("");

  useEffect(() => {
    if (!onWarningKeysChange) return;

    const sig = warningKeys.join("|");
    if (sig === lastWarningsSigRef.current) return;

    lastWarningsSigRef.current = sig;
    onWarningKeysChange([...warningKeys]);
  }, [warningKeys, onWarningKeysChange]);
}
