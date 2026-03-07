"use client";

/**
 * @file apps/studio/src/features/confirm/useConfirm.ts
 * @layer hooks/confirm
 *
 * @description
 * Hook utilitaire exposant la fonction `confirm()` du provider global de confirmation.
 *
 * @remarks
 * - Doit être utilisé sous `<ConfirmDialogProvider>`.
 * - Retourne une fonction `(opts?) => Promise<boolean>`.
 * - Strict : throw si utilisé hors provider.
 */

import { useContext } from "react";

import {
  ConfirmContext,
  type ConfirmOptions,
} from "@compoz/studio/features/confirm/ConfirmDialogProvider";

/**
 * Retour attendu de `useConfirm`.
 */
export type UseConfirm = (opts?: ConfirmOptions) => Promise<boolean>;

/**
 * Hook `useConfirm`.
 *
 * @returns Une fonction `confirm(opts?)` retournant une `Promise<boolean>`.
 * @throws Si utilisé hors du provider.
 */
export function useConfirm(): UseConfirm {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    throw new Error("useConfirm must be used within <ConfirmDialogProvider>");
  }

  // ✅ Le type est déjà garanti par le contexte : pas de cast nécessaire.
  return ctx.confirm;
}

useConfirm.displayName = "useConfirm";
