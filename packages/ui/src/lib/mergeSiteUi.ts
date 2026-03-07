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
 * - primitives (string/number/boolean/etc): override (custom gagne)
 * - undefined: fallback sur base
 */

import type {
  SiteGlobalUi,
  SiteGlobalUiOverride,
} from "@compoz/ui/site/site-ui.types.ts";

type AnyRecord = Record<string, unknown>;

function isPlainObject(v: unknown): v is AnyRecord {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;

  // On restreint aux objets "JSON-like" pour éviter de merger des instances surprises.
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function deepMerge<T>(base: T, override: unknown): T {
  // Si override est undefined => fallback base.
  // Si override n'est pas un plain object => override gagne (primitives / arrays / etc.).
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T;
  }

  const out: AnyRecord = { ...(base as AnyRecord) };

  for (const key of Object.keys(override)) {
    const o = (override as AnyRecord)[key];
    if (o === undefined) continue;

    const b = (base as AnyRecord)[key];

    // arrays => override
    if (Array.isArray(o)) {
      out[key] = o;
      continue;
    }

    // plain objects => recurse
    if (isPlainObject(o) && isPlainObject(b)) {
      out[key] = deepMerge(b, o);
      continue;
    }

    // primitives / functions / etc => override
    out[key] = o;
  }

  return out as T;
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
