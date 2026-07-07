/**
 * @file packages/core/src/domain/site/index/utils.ts
 * @layer core/domain/site/index
 * @description Pure immutable helpers for updating the site page index.
 * @remarks
 * Helpers preserve references on no-op updates and clone only when the index actually changes.
 */

import {
  POS_APPEND,
  POS_PREPEND,
} from "@compoz/core/constants/common/position-tokens";
import type { PageSummary } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

/** Supported insertion positions for a page reference. */
export type PositionSpecifier =
  | typeof POS_APPEND
  | typeof POS_PREPEND
  | { beforeId: string }
  | { afterId: string };

function hasId(pages: SiteIndex["pages"], id: string): boolean {
  return pages.some((p) => p.id === id);
}

/** Inserts a page reference while preserving the original array on duplicate ids. */
function insertWithPosition(
  pages: SiteIndex["pages"],
  ref: Readonly<PageSummary>,
  position: Readonly<PositionSpecifier> = POS_APPEND,
): SiteIndex["pages"] {
  if (hasId(pages, ref.id)) return pages; // no-op: preserve the original array reference

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

/** Upserts a page reference while preserving the original index on no-op updates. */
export function upsertPageRef(
  index: SiteIndex,
  ref: Readonly<PageSummary>,
  position: Readonly<PositionSpecifier> = POS_APPEND,
): SiteIndex {
  const i = index.pages.findIndex((p) => p.id === ref.id);

  if (i >= 0) {
    const prev = index.pages[i];

    // no-op: preserve the original index reference
    if (
      prev.slug === ref.slug &&
      prev.name === ref.name &&
      prev.parentId === ref.parentId
    )
      return index;

    const pages = index.pages.slice();
    pages[i] = {
      ...prev,
      slug: ref.slug,
      name: ref.name,
      parentId: ref.parentId ?? null,
    };
    return { ...index, pages };
  }

  return { ...index, pages: insertWithPosition(index.pages, ref, position) };
}

/** Removes a page reference while preserving the original index when no page matches. */
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
 * Reorders only the children of a parent while keeping all other pages stable.
 * @remarks
 * Returns the original index unless `childIds` exactly matches the current child id set.
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

  // Defensive no-op unless the caller provides the complete child id set.
  if (childIds.length !== currentChildren.length) return index;

  const currentIds = currentChildren.map((c) => c.id);
  const sameSet =
    childIds.every((id) => currentIds.includes(id)) &&
    currentIds.every((id) => childIds.includes(id));
  if (!sameSet) return index;

  // no-op: preserve the original index when the order is already correct
  const already = currentIds.every((id, i) => id === childIds[i]);
  if (already) return index;

  const byId = new Map(currentChildren.map((c) => [c.id, c]));
  const orderedChildren = childIds.map((id) => byId.get(id)!);

  // Reinsert at the first existing child position to keep surrounding page order stable.
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

/** Detaches all children from a parent while preserving the original index on no-op updates. */
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
