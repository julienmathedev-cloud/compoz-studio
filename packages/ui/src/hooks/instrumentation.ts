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
 * - S’appuie sur le nano-logger partagé pour respecter le niveau de logs
 *   configuré via `NEXT_PUBLIC_LOG_LEVEL`.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { log } from "@compoz/infra/lib/log";

const NS = "compoz:shared:ui:hooks";
const lg = log.child({ ns: NS });

type FnOpts = Readonly<{ signal?: AbortSignal }>;
type MaybeSignalFn<T> = ((opts: FnOpts) => Promise<T>) | (() => Promise<T>);

function writeLog(
  level: "debug" | "info" | "warn" | "error",
  event: string,
  meta?: Record<string, unknown>,
): void {
  try {
    if (level === "debug") {
      lg.debug(event, meta);
      return;
    }

    if (level === "info") {
      lg.info(event, meta);
      return;
    }

    if (level === "warn") {
      lg.warn(event, meta);
      return;
    }

    lg.error(event, meta);
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
    if (isAbortError(e)) {
      writeLog("debug", `${name}.abort`, {
        ...meta,
        ms: Date.now() - start,
      });
      throw e;
    }

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

  if (typeof DOMException !== "undefined" && e instanceof DOMException) {
    return e.name === "AbortError";
  }

  if (e instanceof Error) {
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
      return await runMaybeSignalFn(fn, opts);
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
      return await runMaybeSignalFn(fn, opts);
    },
  );
}
