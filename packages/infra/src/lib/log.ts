/**
 * @file packages/infra/src/lib/log.ts
 * @layer infra/lib
 * @description Isomorphic nano-logger with context merging, redaction, and span tracing.
 * @remarks
 * Server logs are serialized as JSON; client logs keep the console-native message/context shape.
 */

import { isAbortError } from "@compoz/infra/http/abort-error";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCtx = Record<string, unknown>;

export type Logger = Readonly<{
  debug: (msg: string, ctx?: LogCtx) => void;
  info: (msg: string, ctx?: LogCtx) => void;
  warn: (msg: string, ctx?: LogCtx) => void;
  error: (msg: string, ctx?: LogCtx) => void;
  child: (extra: LogCtx) => Logger;
}>;

const LEVELS = ["debug", "info", "warn", "error"] as const;

const IS_SERVER = typeof window === "undefined";

function isLevel(value: string): value is LogLevel {
  return LEVELS.includes(value as LogLevel);
}

function levelIndex(lvl: LogLevel): number {
  return LEVELS.indexOf(lvl);
}

const ENV_LEVEL = String(
  process.env["NEXT_PUBLIC_LOG_LEVEL"] ?? "info",
).toLowerCase();

const MIN: LogLevel = isLevel(ENV_LEVEL) ? ENV_LEVEL : "info";
const MIN_IDX = levelIndex(MIN);

let baseCtx: LogCtx = {};

/** Context keys redacted recursively before logs are emitted. */
const SENSITIVE_KEY_LIST = [
  "password",
  "token",
  "authorization",
  "secret",
] as const;

const SENSITIVE_KEYS = new Set<string>(SENSITIVE_KEY_LIST);

function setLogContext(ctx?: LogCtx): void {
  if (!ctx) return;
  baseCtx = { ...baseCtx, ...ctx };
}

function shouldLog(lvl: LogLevel): boolean {
  return levelIndex(lvl) >= MIN_IDX;
}

function redact(obj?: LogCtx): LogCtx | undefined {
  if (!obj) return obj;
  return redactValue(obj, new WeakSet<object>()) as LogCtx;
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

function emit(lvl: LogLevel, msg: string, ctx?: LogCtx): void {
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

function child(extra: LogCtx): Logger {
  const merge = (c?: LogCtx): LogCtx => ({ ...extra, ...(c ?? {}) });

  return {
    debug: (m, c) => emit("debug", m, merge(c)),
    info: (m, c) => emit("info", m, merge(c)),
    warn: (m, c) => emit("warn", m, merge(c)),
    error: (m, c) => emit("error", m, merge(c)),
    child: (more) => child({ ...extra, ...more }),
  };
}

export const log: Logger & Readonly<{ setContext: (ctx?: LogCtx) => void }> = {
  debug: (m, c) => emit("debug", m, c),
  info: (m, c) => emit("info", m, c),
  warn: (m, c) => emit("warn", m, c),
  error: (m, c) => emit("error", m, c),
  child,
  setContext: setLogContext,
} as const;

/** Wraps an operation with start/end/error logs and duration metadata. */
export async function logSpan<T>(
  name: string,
  ctx: LogCtx | undefined,
  fn: () => Promise<T> | T,
): Promise<T> {
  const started = Date.now();
  log.debug(`${name}.start`, ctx);

  try {
    const result = await fn();
    log.debug(`${name}.end`, { ...(ctx ?? {}), ms: Date.now() - started });
    return result;
  } catch (err: unknown) {
    const ms = Date.now() - started;

    if (isAbortError(err)) {
      log.debug(`${name}.abort`, { ...(ctx ?? {}), ms });
      throw err;
    }

    log.error(`${name}.error`, {
      ...(ctx ?? {}),
      ms,
      err: serializeError(err),
    });
    throw err;
  }
}

export async function logSpanNoCtx<T>(
  name: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  return logSpan(name, undefined, fn);
}
