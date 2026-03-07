"use client";

/**
 * @file apps/studio/src/features/settings/_shared/useStableWarningKeys.ts
 * @layer hooks/studio/site/settings/shared
 *
 * @description
 * Hook utilitaire pour remonter une liste de warning keys uniquement si elle change réellement.
 *
 * @remarks
 * - Évite les notifications/redessins inutiles côté parent.
 * - La comparaison repose sur une signature stable `join("|")`.
 * - Hook purement UI, sans logique métier.
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
