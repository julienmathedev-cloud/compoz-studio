"use client";

/**
 * @file apps/studio/src/features/confirm/ConfirmDialogProvider.tsx
 * @layer ui/providers
 *
 * @description
 * Dialogue de confirmation global (contexte + provider) accessible via `useConfirm()`.
 *
 * @remarks
 * - Expose `confirm(opts)` qui ouvre le dialogue et résout une promesse `boolean`.
 * - Monte un unique `<Dialog>` au plus haut niveau de l’arbre.
 * - Supporte une option d’acknowledge (case à cocher) pour bloquer la confirmation.
 * - Strictement UI-only.
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

/** Tonalité visuelle/UX du dialogue. */
type ConfirmTone = "default" | "danger";

/**
 * Options passées à `confirm(...)`.
 * Tous les champs sont optionnels, des valeurs par défaut sont fournies
 * par le provider.
 */
export type ConfirmOptions = Readonly<{
  title?: ReactNode;
  /** Description textuelle ou contenu riche (liste, paragraphes, etc.). */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Optionnel : demande à l’utilisateur de cocher une case avant de confirmer. */
  requireAcknowledge?: { label: string };
}>;

/** State interne géré par le provider (UI + callback de résolution). */
type InternalState = ConfirmOptions &
  Readonly<{
    open: boolean;
    /** Résolution de la promesse pour le dernier `confirm()` appelé. */
    resolve?: (v: boolean) => void;
  }>;

type ConfirmContextValue = Readonly<{
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
}>;

/**
 * Contexte exposant une fonction `confirm` qui ouvre le dialogue
 * et renvoie une promesse résolue à `true` (confirmé) ou `false` (annulé).
 */
export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Provider global du dialogue de confirmation.
 *
 * @remarks
 * - Doit encapsuler l’arbre qui consomme `useConfirm()`.
 * - Rend les enfants + un unique `<Dialog>` monté au plus haut niveau.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>({ open: false });
  const [ack, setAck] = useState(false);

  // ✅ Anti double-resolve (Radix peut déclencher plusieurs chemins de fermeture).
  const hasResolvedRef = useRef(false);

  // Préfixe d’ID stable (a11y + anti-collision).
  const providerId = useIdPrefix("confirm-dialog");
  const acknowledgeId = `${providerId}-acknowledge`;

  const hasDescription = Boolean(state.description);

  /**
   * Ferme le dialogue et nettoie l’état sensible (resolve + ack).
   */
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
   * Résout la promesse une seule fois (sécurité).
   *
   * @remarks
   * On lit `resolve` depuis l’état courant au moment de l’action,
   * puis on nettoie immédiatement.
   */
  const resolveOnce = useCallback(
    (value: boolean) => {
      if (hasResolvedRef.current) return;
      hasResolvedRef.current = true;

      // Lecture "instantanée" : si pas de resolve (cas edge), on ferme quand même.
      state.resolve?.(value);
      closeAndReset();
    },
    [closeAndReset, state],
  );

  /**
   * Ouvre le dialogue et renvoie une promesse boolean.
   * Réinitialise l’acknowledge et stocke la fonction `resolve` dans l’état interne.
   */
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

  /**
   * Annule la confirmation en cours :
   * - Résout la promesse à `false`.
   */
  const onCancel = useCallback(() => {
    resolveOnce(false);
  }, [resolveOnce]);

  /**
   * Confirme :
   * - Si `requireAcknowledge` est actif, bloque tant que la case n’est pas cochée.
   * - Résout la promesse à `true`.
   */
  const onConfirm = useCallback(() => {
    if (state.requireAcknowledge && !ack) return;
    resolveOnce(true);
  }, [state.requireAcknowledge, ack, resolveOnce]);

  /** Valeur de contexte mémoïsée (évite des rerenders inutiles). */
  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {/* Dialogue de confirmation global (monté une seule fois). */}
      <Dialog
        open={state.open}
        onOpenChange={(o) => {
          // Si l’utilisateur ferme via overlay/escape, on annule.
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
