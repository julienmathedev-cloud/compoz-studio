"use client";

/**
 * @file apps/studio/src/features/confirm/ConfirmDialogProvider.tsx
 * @layer studio/features/confirm
 *
 * @description
 * Global confirmation dialog context and provider exposed through `useConfirm()`.
 *
 * @remarks
 * - Exposes `confirm(opts)`, which opens the dialog and resolves to a boolean.
 * - Mounts a single Studio `<Dialog>` near the top of the client tree.
 * - Supports an optional acknowledge checkbox that blocks confirmation until checked.
 * - Guards promise resolution so Radix close paths cannot resolve the same confirmation twice.
 */

import type { ReactNode } from "react";
import { createContext, useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import { Checkbox } from "@compoz/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@compoz/ui/components/ui/dialog";
import { useIdPrefix } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_CENTER } from "@compoz/ui/styles/studio/layout";

type ConfirmTone = "default" | "danger";

/** Options passed to `confirm(...)`; provider defaults fill omitted fields. */
export type ConfirmOptions = Readonly<{
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  requireAcknowledge?: { label: string };
}>;

type InternalState = ConfirmOptions &
  Readonly<{
    open: boolean;
    /** Resolver for the latest `confirm()` promise. */
    resolve?: (v: boolean) => void;
  }>;

type ConfirmContextValue = Readonly<{
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
}>;

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>({ open: false });
  const [ack, setAck] = useState(false);

  // Prevent double resolution because Radix can trigger multiple close paths.
  const hasResolvedRef = useRef(false);

  // Stable id prefix for a11y and collision avoidance.
  const providerId = useIdPrefix("confirm-dialog");
  const acknowledgeId = `${providerId}-acknowledge`;

  const hasDescription = Boolean(state.description);

  const closeAndReset = useCallback(() => {
    setState((s) => ({
      ...s,
      open: false,
      resolve: undefined,
    }));
    setAck(false);
    hasResolvedRef.current = false;
  }, []);

  /**
   * Resolves the active confirmation promise at most once.
   *
   * @remarks
   * Reads `resolve` from the current state at action time, then clears state immediately.
   */
  const resolveOnce = useCallback(
    (value: boolean) => {
      if (hasResolvedRef.current) return;
      hasResolvedRef.current = true;

      // If no resolver exists in an edge case, still close the dialog.
      state.resolve?.(value);
      closeAndReset();
    },
    [closeAndReset, state],
  );

  const confirm = useCallback((opts?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      hasResolvedRef.current = false;
      setAck(false);

      setState({
        open: true,
        resolve,
        title: opts?.title ?? "Confirmer l’action",
        description: opts?.description,
        confirmLabel: opts?.confirmLabel ?? "Confirmer",
        cancelLabel: opts?.cancelLabel ?? "Annuler",
        tone: opts?.tone ?? "default",
        requireAcknowledge: opts?.requireAcknowledge,
      });
    });
  }, []);

  const onCancel = useCallback(() => {
    resolveOnce(false);
  }, [resolveOnce]);

  const onConfirm = useCallback(() => {
    if (state.requireAcknowledge && !ack) return;
    resolveOnce(true);
  }, [state.requireAcknowledge, ack, resolveOnce]);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <Dialog
        open={state.open}
        onOpenChange={(o) => {
          // Overlay or Escape close paths cancel the active confirmation.
          if (!o) onCancel();
        }}
      >
        <DialogContent
          visualMode="studio"
          className="bg-card"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
          </DialogHeader>

          {hasDescription ? <div>{state.description}</div> : null}

          {state.requireAcknowledge ? (
            <div className={cn(ROW_CENTER, "text-sm")}>
              <Checkbox
                id={acknowledgeId}
                checked={ack}
                onCheckedChange={(v) => setAck(v === true)}
              />
              <label htmlFor={acknowledgeId}>
                {state.requireAcknowledge.label}
              </label>
            </div>
          ) : null}

          <DialogFooter
            visualMode="studio"
            className={cn("bg-secondary/20 py-1.5")}
          >
            <Button
              variant="ghost"
              visualMode="studio"
              size="sm"
              onClick={onCancel}
            >
              {state.cancelLabel}
            </Button>

            <Button
              onClick={onConfirm}
              size="sm"
              variant={state.tone === "danger" ? "destructive" : "default"}
              visualMode="studio"
              disabled={Boolean(state.requireAcknowledge) && !ack}
            >
              {state.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

ConfirmDialogProvider.displayName = "ConfirmDialogProvider";
