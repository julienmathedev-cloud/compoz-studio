/**
 * @file packages/infra/src/kv/kv-telemetry.ts
 * @layer infra/kv
 * @description Development-only telemetry helpers for KV command auditing and tracing.
 * @remarks
 * Logs stable contexts and operations only; KV keys and PII must never be logged here.
 */

type KvOp =
  | "get"
  | "set"
  | "del"
  | "mget"
  | "hget"
  | "hset"
  | "hdel"
  | "hgetall"
  | "lrange"
  | "scan"
  | "other"
  | "sadd"
  | "srem"
  | "smembers"
  | "pipeline";

type KvMetricKey = `${string}::${KvOp}`;

const NODE_ENV = process.env.NODE_ENV ?? "development";
const IS_PROD = NODE_ENV === "production";

const NEXT_PHASE = process.env.NEXT_PHASE ?? "";
const IS_NEXT_BUILD =
  NEXT_PHASE === "phase-production-build" ||
  NEXT_PHASE === "phase-export" ||
  NEXT_PHASE.includes("build");

/** Slow-command threshold in milliseconds, configurable through `KV_SLOW_MS`. */
const SLOW_MS = Number(process.env.KV_SLOW_MS ?? "1000");

/** Production and build tracing require explicit opt-in flags. */
const TRACE_ALLOW_PROD = process.env.KV_TRACE_ALLOW_PROD === "1";
const TRACE_ALLOW_BUILD = process.env.KV_TRACE_ALLOW_BUILD === "1";

const DEBUG_ALLOW_PROD = process.env.KV_DEBUG_ALLOW_PROD === "1";
const DEBUG_ALLOW_BUILD = process.env.KV_DEBUG_ALLOW_BUILD === "1";

const DEBUG_ENABLED =
  process.env.KV_DEBUG === "1" &&
  (!IS_PROD || DEBUG_ALLOW_PROD) &&
  (!IS_NEXT_BUILD || DEBUG_ALLOW_BUILD);

const TRACE_ENABLED =
  process.env.KV_TRACE === "1" &&
  (!IS_PROD || TRACE_ALLOW_PROD) &&
  (!IS_NEXT_BUILD || TRACE_ALLOW_BUILD);

const counters = new Map<KvMetricKey, number>();
let totalOps = 0;

function incr(key: KvMetricKey) {
  totalOps += 1;
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

function nowMs(): number {
  const p = globalThis.performance;
  if (p && typeof p.now === "function") return p.now();
  return Date.now();
}

export function resetKvStats(): void {
  counters.clear();
  totalOps = 0;
}

export function dumpKvStats(label: string): void {
  const entries = Array.from(counters.entries()).sort((a, b) => b[1] - a[1]);

  console.warn("========== KV AUDIT ==========");
  console.warn("label:", label);
  console.warn("totalOps:", totalOps);

  for (const [k, v] of entries) console.warn(`${k} = ${v}`);

  console.warn("================================");

  resetKvStats();
}

export function autoDumpKvStats(label: string): void {
  if (!DEBUG_ENABLED) return;

  console.warn("KV_DEBUG =", process.env.KV_DEBUG);
  console.warn("KV_TRACE =", process.env.KV_TRACE);
  console.warn("NODE_ENV =", NODE_ENV);
  console.warn("NEXT_PHASE =", NEXT_PHASE);

  dumpKvStats(label);
}

export function kvAuditEnabled(): boolean {
  return DEBUG_ENABLED;
}

export function kvTraceEnabled(): boolean {
  return TRACE_ENABLED;
}

export async function kvCmd<T>(
  context: string,
  op: KvOp,
  exec: () => Promise<T>,
): Promise<T> {
  if (!DEBUG_ENABLED && !TRACE_ENABLED) return exec();

  if (DEBUG_ENABLED) {
    const key: KvMetricKey = `${context}::${op}`;
    incr(key);
  }

  const start = TRACE_ENABLED ? nowMs() : 0;

  try {
    const res = await exec();

    if (TRACE_ENABLED) {
      const ms = Math.round((nowMs() - start) * 1000) / 1000;

      if (Number.isFinite(SLOW_MS) && ms >= SLOW_MS) {
        console.warn(`[kv][trace][slow] ${context} op=${op} ${ms}ms`);
      } else {
        console.warn(`[kv][trace] ${context} op=${op} ${ms}ms`);
      }
    }

    return res;
  } catch (err) {
    if (TRACE_ENABLED) {
      const ms = Math.round((nowMs() - start) * 1000) / 1000;
      console.error(`[kv][trace][error] ${context} op=${op} ${ms}ms`);
    }
    throw err;
  }
}
