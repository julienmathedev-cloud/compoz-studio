/**
 * @file packages/infra/src/lib/log.ts
 * @layer infra/lib
 * @description
 * Nano-logger isomorphe (server + client) :
 * - niveau minimal via `NEXT_PUBLIC_LOG_LEVEL`,
 * - contexte global (`setContext`) + loggers enfants (`child`),
 * - redaction des clés sensibles,
 * - instrumentation via `logSpan` (start/end + durée + erreur).
 */

import { isAbortError } from "@compoz/infra/http/abort-error";

type Level = "debug" | "info" | "warn" | "error";
const LEVELS = ["debug", "info", "warn", "error"] as const;

/** Détecte l’environnement d’exécution une seule fois (évite le coût dans emit). */
const IS_SERVER = typeof window === "undefined";

function isLevel(value: string): value is Level {
  return LEVELS.includes(value as Level);
}

function levelIndex(lvl: Level): number {
  return LEVELS.indexOf(lvl);
}

/**
 * Normalise le niveau minimal à partir de la variable d’environnement.
 * Si la valeur est inconnue, on retombe sur `"info"`.
 */
const ENV_LEVEL = String(
  process.env["NEXT_PUBLIC_LOG_LEVEL"] ?? "info",
).toLowerCase();

const MIN: Level = isLevel(ENV_LEVEL) ? ENV_LEVEL : "info";
const MIN_IDX = levelIndex(MIN);

/** Contexte global léger ajouté à chaque log (ex: app, version, env). */
let baseCtx: Record<string, unknown> = {};

/** Clés qui seront masquées si présentes dans un contexte (comparaison case-insensitive). */
const SENSITIVE_KEY_LIST = [
  "password",
  "token",
  "authorization",
  "secret",
] as const;

const SENSITIVE_KEYS = new Set<string>(SENSITIVE_KEY_LIST);

/**
 * Met à jour (merge) le contexte global ajouté à chaque log.
 *
 * - Non destructif sur l’objet : utilise une nouvelle référence à chaque fois.
 * - Les nouvelles clés écrasent les anciennes si elles ont le même nom.
 *
 * @param ctx Contexte à fusionner (optionnel).
 */
function setLogContext(ctx?: Record<string, unknown>): void {
  if (!ctx) return;
  baseCtx = { ...baseCtx, ...ctx };
}

function shouldLog(lvl: Level): boolean {
  return levelIndex(lvl) >= MIN_IDX;
}

function redact(obj?: Record<string, unknown>) {
  if (!obj) return obj;
  return redactValue(obj, new WeakSet<object>()) as Record<string, unknown>;
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null) return null;
  if (typeof value !== "object") return value;

  const isArray = Array.isArray(value);
  const container = value as Record<string, unknown>;

  if (seen.has(container)) return isArray ? [] : {};
  seen.add(container);

  if (isArray) {
    return (value as ReadonlyArray<unknown>).map((item) =>
      redactValue(item, seen),
    );
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(container)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase())
      ? "***"
      : redactValue(val, seen);
  }
  return out;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }

  if (typeof err === "object" && err !== null) {
    try {
      return { value: JSON.stringify(err) };
    } catch {
      return { value: String(err) };
    }
  }

  return { value: String(err) };
}

function emit(lvl: Level, msg: string, ctx?: Record<string, unknown>): void {
  if (!shouldLog(lvl)) return;

  const mergedCtx = { ...redact(baseCtx), ...redact(ctx) };

  const record = {
    level: lvl,
    msg,
    time: new Date().toISOString(),
    ...mergedCtx,
  };

  if (IS_SERVER) {
    const line = JSON.stringify(record);
    switch (lvl) {
      case "debug":
        console.debug(line);
        break;
      case "info":
        console.info(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "error":
        console.error(line);
        break;
      default:
        console.log(line);
    }
  } else {
    switch (lvl) {
      case "debug":
        console.debug(msg, mergedCtx);
        break;
      case "info":
        console.info(msg, mergedCtx);
        break;
      case "warn":
        console.warn(msg, mergedCtx);
        break;
      case "error":
        console.error(msg, mergedCtx);
        break;
      default:
        console.log(msg, mergedCtx);
    }
  }
}

function child(extra: Record<string, unknown>) {
  const merge = (c?: Record<string, unknown>) => ({ ...extra, ...(c ?? {}) });

  return {
    debug: (m: string, c?: Record<string, unknown>) =>
      emit("debug", m, merge(c)),
    info: (m: string, c?: Record<string, unknown>) => emit("info", m, merge(c)),
    warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, merge(c)),
    error: (m: string, c?: Record<string, unknown>) =>
      emit("error", m, merge(c)),
    child: (more: Record<string, unknown>) => child({ ...extra, ...more }),
  };
}

export const log = {
  debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => emit("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => emit("error", m, c),
  child,
  setContext: setLogContext,
} as const;

export async function logSpan<T>(
  name: string,
  ctx: Record<string, unknown> | undefined,
  fn: () => Promise<T> | T,
): Promise<T> {
  const started = Date.now();
  log.debug(`${name}.start`, ctx);

  try {
    const result = await fn();
    log.debug(`${name}.end`, { ...ctx, ms: Date.now() - started });
    return result;
  } catch (err: unknown) {
    const ms = Date.now() - started;

    if (isAbortError(err)) {
      log.debug(`${name}.abort`, { ...ctx, ms });
      throw err;
    }

    log.error(`${name}.error`, { ...ctx, ms, err: serializeError(err) });
    throw err;
  }
}

export async function logSpanNoCtx<T>(
  name: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  return logSpan(name, undefined, fn);
}
