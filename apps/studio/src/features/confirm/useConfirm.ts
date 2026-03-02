"use client";

/**
 * @file apps/studio/src/features/confirm/useConfirm.ts
 * @layer hooks
 *
 * @description
 * Hook utilitaire exposant la fonction `confirm()` du provider global de confirmation.
 *
 * @remarks
 * - Doit être utilisé sous `<ConfirmDialogProvider>`.
 * - Retourne une fonction `(opts?) => Promise<boolean>`.
 */

import {
  ConfirmContext,
  type ConfirmOptions,
} from "@compoz/studio/features/confirm/ConfirmDialogProvider";
import { useContext } from "react";

/**
 * Hook `useConfirm`
 *
 * @returns Une fonction `confirm(opts?)` retournant un `Promise<boolean>`.
 * @throws Si utilisé hors du provider.
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);

  // Garde stricte : usage obligatoire dans le provider.
  if (!ctx) {
    throw new Error("useConfirm must be used within <ConfirmDialogProvider>");
  }

  // Narrowing explicite pour la fonction de confirmation.
  return ctx.confirm as (opts?: ConfirmOptions) => Promise<boolean>;
}
