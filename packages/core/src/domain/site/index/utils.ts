/**
 * @file packages/core/src/domain/site/index/utils.ts
 * @layer core/domain
 * @description
 * Helpers purs (immutables) pour manipuler l’index des pages (clé = id).
 *
 * @remarks
 * - No-op : retourne la même référence si rien ne change.
 * - Clone uniquement en cas de modification.
 * - Utilisé par `updateSiteIndex` et les use-cases de publication.
 */

import {
  POS_APPEND,
  POS_PREPEND,
} from "@compoz/core/constants/common/position-tokens";
import type { PageSummary } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

/**
 * Positionnement optionnel lors d’un ajout.
 * - `POS_APPEND` / `POS_PREPEND`
 * - `{ beforeId: string }` / `{ afterId: string }`
 */
export type PositionSpecifier =
  | typeof POS_APPEND
  | typeof POS_PREPEND
  | { beforeId: string }
  | { afterId: string };

/* ─────────────── Internes ─────────────── */

/** Indique si un id est déjà présent dans la liste. */
function hasId(pages: SiteIndex["pages"], id: string): boolean {
  return pages.some((p) => p.id === id);
}

/**
 * Insère une page avec une position donnée.
 * - Si l’id existe déjà → no-op (même référence).
 * - Sinon → retourne un nouveau tableau avec l’élément inséré.
 */
function insertWithPosition(
  pages: SiteIndex["pages"],
  ref: Readonly<PageSummary>,
  position: Readonly<PositionSpecifier> = POS_APPEND,
): SiteIndex["pages"] {
  if (hasId(pages, ref.id)) return pages; // no-op: même ref

  const next = [...pages];

  if (position === POS_APPEND) {
    next.push({ ...ref });
  } else if (position === POS_PREPEND) {
    next.unshift({ ...ref });
  } else if ("beforeId" in position) {
    const i = next.findIndex((p) => p.id === position.beforeId);
    if (i >= 0) next.splice(i, 0, { ...ref });
    else next.push({ ...ref });
  } else if ("afterId" in position) {
    const i = next.findIndex((p) => p.id === position.afterId);
    if (i >= 0) next.splice(i + 1, 0, { ...ref });
    else next.push({ ...ref });
  }

  return next;
}

/* ─────────────── Exposés ─────────────── */

/**
 * Upsert par id :
 * - s’il existe → met à jour `slug` / `title` si besoin (no-op si identique).
 * - sinon      → insère à la position demandée.
 */
export function upsertPageRef(
  index: SiteIndex,
  ref: Readonly<PageSummary>,
  position: Readonly<PositionSpecifier> = POS_APPEND,
): SiteIndex {
  const i = index.pages.findIndex((p) => p.id === ref.id);

  // Cas 1 : la page existe déjà
  if (i >= 0) {
    const prev = index.pages[i];

    // Rien ne change → no-op
    if (
      prev.slug === ref.slug &&
      prev.title === ref.title &&
      prev.parentId === ref.parentId
    )
      return index;

    // Sinon, on met à jour uniquement cette entrée
    const pages = index.pages.slice();
    pages[i] = {
      ...prev,
      slug: ref.slug,
      title: ref.title,
      parentId: ref.parentId ?? null,
    };
    return { ...index, pages };
  }

  // Cas 2 : nouvelle page → insertion à la position demandée
  return { ...index, pages: insertWithPosition(index.pages, ref, position) };
}

/**
 * Supprime une page par id.
 * - Si aucune entrée ne correspond → no-op (même référence, removed = false).
 * - Sinon → retourne un nouvel index et `removed = true`.
 */
export function removePageById(
  index: SiteIndex,
  pageId: string,
): { next: SiteIndex; removed: boolean } {
  const before = index.pages.length;
  const pages = index.pages.filter((p) => p.id !== pageId);

  if (pages.length === before) {
    return { next: index, removed: false };
  }

  return { next: { ...index, pages }, removed: true };
}

/**
 * Réordonne uniquement les enfants d’un parent en conservant l’ordre global
 * des autres pages (stable).
 *
 * @remarks
 * - Exige que `childIds` corresponde exactement aux enfants actuels (même set).
 * - No-op si l’ordre est déjà identique.
 */
export function reorderChildrenByParentId(
  index: SiteIndex,
  parentId: string,
  childIds: ReadonlyArray<string>,
): SiteIndex {
  const pid = String(parentId ?? "").trim();
  if (!pid) return index;

  const currentChildren = index.pages.filter((p) => p.parentId === pid);
  if (currentChildren.length === 0) return index;

  // Défense : liste complète et mêmes ids
  if (childIds.length !== currentChildren.length) return index;

  const currentIds = currentChildren.map((c) => c.id);
  const sameSet =
    childIds.every((id) => currentIds.includes(id)) &&
    currentIds.every((id) => childIds.includes(id));
  if (!sameSet) return index;

  // No-op si déjà dans le bon ordre
  const already = currentIds.every((id, i) => id === childIds[i]);
  if (already) return index;

  const byId = new Map(currentChildren.map((c) => [c.id, c]));
  const orderedChildren = childIds.map((id) => byId.get(id)!);

  // Position de réinjection = index du 1er enfant rencontré
  const firstChildIndex = index.pages.findIndex((p) => p.parentId === pid);

  const without = index.pages.filter((p) => p.parentId !== pid);

  const nextPages =
    firstChildIndex >= 0
      ? [
          ...without.slice(0, firstChildIndex),
          ...orderedChildren,
          ...without.slice(firstChildIndex),
        ]
      : [...without, ...orderedChildren];

  return { ...index, pages: nextPages };
}

/**
 * Détache tous les enfants d’un parent (parentId -> null).
 * No-op si aucun enfant.
 */
export function detachChildrenByParentId(
  index: SiteIndex,
  parentId: string,
): SiteIndex {
  const pid = String(parentId ?? "").trim();
  if (!pid) return index;

  let changed = false;

  const pages = index.pages.map((p) => {
    if (p.parentId !== pid) return p;
    changed = true;
    return { ...p, parentId: null };
  });

  if (!changed) return index;
  return { ...index, pages };
}
