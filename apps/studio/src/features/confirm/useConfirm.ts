"use client";

/**
 * @file apps/studio/src/features/confirm/useConfirm.ts
 * @layer studio/features/confirm
 *
 * @description
 * Hook exposing the global confirmation provider `confirm()` function.
 *
 * @remarks
 * - Must be used under `<ConfirmDialogProvider>`.
 * - Throws when used outside the provider to catch missing provider wiring early.
 */

import { useContext } from "react";

import {
  ConfirmContext,
  type ConfirmOptions,
} from "@compoz/studio/features/confirm/ConfirmDialogProvider";

export type UseConfirm = (opts?: ConfirmOptions) => Promise<boolean>;

/** Returns the global `confirm(opts?)` function from the confirmation provider. */
export function useConfirm(): UseConfirm {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    throw new Error("useConfirm must be used within <ConfirmDialogProvider>");
  }

  return ctx.confirm;
}

useConfirm.displayName = "useConfirm";
