/**
 * @file packages/ui/src/hooks/instrumentation.ts
 * @layer hooks/shared
 *
 * @description
 * Helpers utilitaires partagés pour les hooks (logs homogènes load/save,
 * adaptation d’erreurs et compatibilité AbortSignal).
 *
 * @remarks
 * - Centralise l’instrumentation des opérations `load` et `save`.
 * - Fournit des wrappers compatibles avec des fonctions acceptant ou non un `AbortSignal`.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { isAbortError } from "@compoz/infra/http/abort-error";
import { log, logSpan } from "@compoz/infra/lib/log";

const lg = log.child({ ns: "hooks" });

type FnOpts = Readonly<{ signal?: AbortSignal }>;
type MaybeSignalFn<T> = ((opts: FnOpts) => Promise<T>) | (() => Promise<T>);

/**
 * Convertit une erreur inconnue en message lisible et sûr.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : String(e);
}

/**
 * Exécute une fonction asynchrone pouvant accepter optionnellement un `AbortSignal`.
 */
async function runMaybeSignalFn<T>(fn: MaybeSignalFn<T>, opts: FnOpts) {
  // Si la fonction attend des args, on lui passe { signal }.
  if (fn.length >= 1) {
    return await (fn as (o: FnOpts) => Promise<T>)(opts);
  }
  return await (fn as () => Promise<T>)();
}

/**
 * Wrapper de chargement instrumenté avec logs homogènes et gestion de l’abort.
 *
 * @param scope - Namespace logique du hook (ex. `"useReadPage"`).
 * @param state - Espace de contenu (draft/published).
 * @param fn - Fonction de chargement (peut accepter `{ signal }`).
 * @param meta - Métadonnées pour enrichir les logs.
 * @param opts - Options d’exécution (ex. `{ signal }` React Query).
 */
export async function withLoadLogs<T>(
  scope: string,
  state: ContentState,
  fn: MaybeSignalFn<T>,
  meta?: Record<string, unknown>,
  opts: FnOpts = {},
): Promise<T> {
  return logSpan(
    `${scope}.load`,
    { scope, op: "load", state, ...(meta ?? {}) },
    async () => {
      try {
        return await runMaybeSignalFn(fn, opts);
      } catch (e: unknown) {
        if (isAbortError(e)) {
          lg.debug("load.abort", {
            scope,
            op: "load",
            state,
            ...(meta ?? {}),
          });
        }
        throw e;
      }
    },
  );
}

/**
 * Wrapper de sauvegarde instrumenté avec logs homogènes et gestion de l’abort.
 *
 * @param scope - Namespace logique du hook (ex. `"useUpdatePage"`).
 * @param state - Espace de contenu (draft/published).
 * @param fn - Fonction de sauvegarde (peut accepter `{ signal }`).
 * @param meta - Métadonnées pour enrichir les logs.
 * @param opts - Options d’exécution (ex. `{ signal }` React Query).
 */
export async function withSaveLogs<T>(
  scope: string,
  state: ContentState,
  fn: MaybeSignalFn<T>,
  meta?: Record<string, unknown>,
  opts: FnOpts = {},
): Promise<T> {
  return logSpan(
    `${scope}.save`,
    { scope, op: "save", state, ...(meta ?? {}) },
    async () => {
      try {
        return await runMaybeSignalFn(fn, opts);
      } catch (e: unknown) {
        if (isAbortError(e)) {
          lg.debug("save.abort", {
            scope,
            op: "save",
            state,
            ...(meta ?? {}),
          });
        }
        throw e;
      }
    },
  );
}
