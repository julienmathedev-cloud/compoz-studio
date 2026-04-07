/**
 * @file packages/ui/src/lib/mergeSiteUi.ts
 * @layer ui/lib/merge
 *
 * @description
 * Fusion "base (default) -> override (custom)" pour les skins UI site.
 *
 * @remarks
 * Stratégie :
 * - objects (plain): deep merge
 * - arrays: override (custom gagne)
 * - strings: merge Tailwind (base + override, override gagne sur conflits)
 * - autres primitives (number/boolean/etc): override (custom gagne)
 * - undefined: fallback sur base
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

  // Merge spécial pour les strings Tailwind.
  if (typeof base === "string" && typeof override === "string") {
    return mergeClassStrings(base, override) as T;
  }

  // Objets simples => deep merge récursif.
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: AnyRecord = { ...(base as AnyRecord) };

    for (const key of Object.keys(override)) {
      const o = (override as AnyRecord)[key];
      if (o === undefined) continue;

      const b = (base as AnyRecord)[key];

      // arrays => override complet
      if (Array.isArray(o)) {
        out[key] = o;
        continue;
      }

      // recurse sur objets simples
      if (isPlainObject(b) && isPlainObject(o)) {
        out[key] = deepMerge(b, o);
        continue;
      }

      // strings => merge de classes
      if (typeof b === "string" && typeof o === "string") {
        out[key] = mergeClassStrings(b, o);
        continue;
      }

      // autres primitives => override simple
      out[key] = o;
    }

    return out as T;
  }

  // Fallback : override gagne.
  return override as T;
}

/**
 * Fusionne un skin complet (base) avec un override partiel.
 *
 * @remarks
 * - base : complet (Default)
 * - override : partiel (custom)
 * - résultat : complet (base avec overrides appliqués)
 */
export function mergeSiteUi(
  base: SiteGlobalUi,
  override?: SiteGlobalUiOverride,
): SiteGlobalUi {
  if (!override) return base;
  return deepMerge(base, override);
}
