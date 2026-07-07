/**
 * @file packages/ui/src/lib/mergeSiteUi.ts
 * @layer ui/lib/merge
 * @description Deep-merges default site UI skins with partial overrides.
 * @remarks
 * Tailwind class strings are merged with conflict resolution; arrays and primitives are replaced by the override value.
 */

import { twMerge } from "tailwind-merge";

import type {
  SiteGlobalUi,
  SiteGlobalUiOverride,
} from "@compoz/ui/site/site-ui.types";

type AnyRecord = Record<string, unknown>;

function isPlainObject(v: unknown): v is AnyRecord {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;

  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function mergeClassStrings(base: string, override: string): string {
  const baseValue = String(base ?? "").trim();
  const overrideValue = String(override ?? "").trim();

  if (!baseValue) return overrideValue;
  if (!overrideValue) return baseValue;
  return twMerge(baseValue, overrideValue);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) return base;

  // Tailwind class strings need conflict-aware merging instead of plain replacement.
  if (typeof base === "string" && typeof override === "string") {
    return mergeClassStrings(base, override) as T;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const out: AnyRecord = { ...(base as AnyRecord) };

    for (const key of Object.keys(override)) {
      const o = (override as AnyRecord)[key];
      if (o === undefined) continue;

      const b = (base as AnyRecord)[key];

      if (Array.isArray(o)) {
        out[key] = o;
        continue;
      }

      if (isPlainObject(b) && isPlainObject(o)) {
        out[key] = deepMerge(b, o);
        continue;
      }

      if (typeof b === "string" && typeof o === "string") {
        out[key] = mergeClassStrings(b, o);
        continue;
      }

      out[key] = o;
    }

    return out as T;
  }

  return override as T;
}

export function mergeSiteUi(
  base: SiteGlobalUi,
  override?: SiteGlobalUiOverride,
): SiteGlobalUi {
  if (!override) return base;
  return deepMerge(base, override);
}
