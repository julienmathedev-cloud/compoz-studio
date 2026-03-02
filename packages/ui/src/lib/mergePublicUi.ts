/**
 * @file packages/ui/src/lib/mergePublicUi.ts
 * @module lib/ui
 *
 * @description
 * Fusion "default -> custom" pour les skins UI publics.
 *
 * @remarks
 * - Stratégie :
 *   - objects: deep merge
 *   - strings: override (custom gagne)
 *   - arrays: override (custom gagne)
 *   - undefined: fallback sur default
 */

import type {
  PublicGlobalUi,
  PublicGlobalUiOverride,
} from "@compoz/ui/site/public-ui.types";

type AnyObj = Record<string, unknown>;

function isPlainObject(v: unknown): v is AnyObj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, override: unknown): T {
  // si override n'est pas un objet, on prend override (ou base si undefined)
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T;
  }

  const out: AnyObj = { ...(base as AnyObj) };

  for (const key of Object.keys(override as AnyObj)) {
    const o = (override as AnyObj)[key];
    if (o === undefined) continue;

    const b = (base as AnyObj)[key];

    // arrays => override
    if (Array.isArray(o)) {
      out[key] = o;
      continue;
    }

    // objects => recurse
    if (isPlainObject(o) && isPlainObject(b)) {
      out[key] = deepMerge(b, o);
      continue;
    }

    // string / number / boolean / function etc => override
    out[key] = o;
  }

  return out as T;
}

/**
 * base = complet (Default)
 * override = partiel (Lola)
 * => return complet
 */
export function mergePublicUi(
  base: PublicGlobalUi,
  override?: PublicGlobalUiOverride,
): PublicGlobalUi {
  if (!override) return base;
  return deepMerge(base, override);
}
