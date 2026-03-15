/**
 * @file packages/ui/src/hooks/instrumentation.ts
 * @layer ui/hooks
 *
 * @description
 * Helpers utilitaires partagés pour les hooks (logs homogènes load/save,
 * adaptation d’erreurs et compatibilité AbortSignal).
 *
 * @remarks
 * - Centralise l’instrumentation des opérations `load` et `save`.
 * - Fournit des wrappers compatibles avec des fonctions acceptant ou non un `AbortSignal`.
 * - UI-only : pas de dépendance vers `@compoz/infra`.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

const NS = "compoz:shared:ui:hooks";

type FnOpts = Readonly<{ signal?: AbortSignal }>;
type MaybeSignalFn<T> = ((opts: FnOpts) => Promise<T>) | (() => Promise<T>);

function writeLog(
  level: "debug" | "info" | "warn" | "error",
  event: string,
  meta?: Record<string, unknown>,
): void {
  try {
    const payload = meta ? { ns: NS, event, ...meta } : { ns: NS, event };

    if (level === "debug") {
      console.debug(payload);
      return;
    }

    if (level === "info") {
      console.info(payload);
      return;
    }

    if (level === "warn") {
      console.warn(payload);
      return;
    }

    console.error(payload);
  } catch {
    // noop
  }
}

async function logSpan<T>(
  name: string,
  meta: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  writeLog("debug", `${name}.start`, meta);

  try {
    const result = await fn();
    writeLog("debug", `${name}.ok`, { ...meta, ms: Date.now() - start });
    return result;
  } catch (e) {
    // Abort/cancel normal → pas une vraie erreur
    if (isAbortError(e)) {
      writeLog("debug", `${name}.abort`, {
        ...meta,
        ms: Date.now() - start,
      });
      throw e;
    }

    // vraie erreur
    writeLog("error", `${name}.error`, {
      ...meta,
      ms: Date.now() - start,
      error: errorMessage(e),
    });

    throw e;
  }
}

function isAbortError(e: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;

  // DOMException("AbortError") dans certains environnements
  if (typeof DOMException !== "undefined" && e instanceof DOMException) {
    return e.name === "AbortError";
  }

  if (e instanceof Error) {
    // fetch abort (node/undici/browsers) varie selon runtime
    return e.name === "AbortError" || /aborted|abort/i.test(e.message);
  }

  return false;
}

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
        throw e;
      }
    },
  );
}
