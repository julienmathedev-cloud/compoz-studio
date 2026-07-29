/**
 * @file packages/core/src/domain/pages/structure/draft-structure-planner.ts
 * @layer core/domain/pages
 * @description Pure validation and deterministic planning for ordered draft page structure.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

export type DraftStructurePage = Readonly<{
  id: string;
  parentId: string | null;
  slug: string;
  paginationEnabled: boolean;
  metaRevision: number;
  position: number;
}>;

export type DraftStructureMutationPlan = Readonly<{
  kind: "mutation";
  pages: ReadonlyArray<DraftStructurePage>;
  paginationDisabledPageIds: ReadonlyArray<string>;
}>;

export type DraftStructureNoopPlan = Readonly<{
  kind: "noop";
  pages: ReadonlyArray<DraftStructurePage>;
  paginationDisabledPageIds: ReadonlyArray<string>;
}>;

export type DraftStructurePlan =
  | DraftStructureMutationPlan
  | DraftStructureNoopPlan;

function fail(code: typeof ERROR_CODES.PAGE_PARENT_INVALID | typeof ERROR_CODES.PAGE_HIERARCHY_CYCLE | typeof ERROR_CODES.PAGE_REORDER_INVALID | typeof ERROR_CODES.PAGE_NOT_FOUND): never {
  throw new DomainError({ code, message: code });
}

function normalized(
  pages: ReadonlyArray<DraftStructurePage>,
): ReadonlyArray<DraftStructurePage> {
  return pages.map((page, position) =>
    page.position === position ? page : { ...page, position },
  );
}

function pageById(
  pages: ReadonlyArray<DraftStructurePage>,
): ReadonlyMap<string, DraftStructurePage> {
  return new Map(pages.map((page) => [page.id, page]));
}

function assertParentIsValid(
  pages: ReadonlyArray<DraftStructurePage>,
  parentId: string | null,
): void {
  if (parentId === null) return;

  const parent = pageById(pages).get(parentId);
  if (!parent) fail(ERROR_CODES.PAGE_NOT_FOUND);
  if (parent.parentId !== null) fail(ERROR_CODES.PAGE_PARENT_INVALID);
}

function insertionIndexAtSiblingEnd(
  pages: ReadonlyArray<DraftStructurePage>,
  parentId: string | null,
): number {
  let lastSiblingIndex = -1;

  pages.forEach((page, index) => {
    if (page.parentId === parentId) lastSiblingIndex = index;
  });

  return lastSiblingIndex >= 0 ? lastSiblingIndex + 1 : pages.length;
}

export function planCreateDraftPage(args: {
  pages: ReadonlyArray<DraftStructurePage>;
  page: DraftStructurePage;
}): DraftStructureMutationPlan {
  const { pages, page } = args;

  if (pageById(pages).has(page.id)) fail(ERROR_CODES.PAGE_REORDER_INVALID);
  if (page.slug === HOME_SLUG && page.parentId !== null) {
    fail(ERROR_CODES.PAGE_PARENT_INVALID);
  }
  assertParentIsValid(pages, page.parentId);

  const normalizedPage =
    page.parentId === null && page.paginationEnabled
      ? { ...page, paginationEnabled: false }
      : page;
  const next = [...pages];
  next.splice(
    insertionIndexAtSiblingEnd(next, page.parentId),
    0,
    normalizedPage,
  );

  return {
    kind: "mutation",
    pages: normalized(next),
    paginationDisabledPageIds: [],
  };
}

export function planReorderDraftSiblings(args: {
  pages: ReadonlyArray<DraftStructurePage>;
  parentId: string | null;
  orderedPageIds: ReadonlyArray<string>;
}): DraftStructurePlan {
  const { pages, parentId, orderedPageIds } = args;
  if (parentId !== null) {
    const parent = pageById(pages).get(parentId);
    if (!parent) fail(ERROR_CODES.PAGE_NOT_FOUND);
    if (parent.parentId !== null) fail(ERROR_CODES.PAGE_PARENT_INVALID);
  }
  const siblings = pages.filter((page) => page.parentId === parentId);
  const currentIds = siblings.map((page) => page.id);
  const uniqueIds = new Set(orderedPageIds);

  if (
    uniqueIds.size !== orderedPageIds.length ||
    orderedPageIds.length !== currentIds.length ||
    orderedPageIds.some((id) => !currentIds.includes(id))
  ) {
    fail(ERROR_CODES.PAGE_REORDER_INVALID);
  }

  if (currentIds.every((id, index) => id === orderedPageIds[index])) {
    return {
      kind: "noop",
      pages,
      paginationDisabledPageIds: [],
    };
  }

  const siblingsById = new Map(siblings.map((page) => [page.id, page]));
  let orderedIndex = 0;
  const next = pages.map((page) =>
    page.parentId === parentId
      ? siblingsById.get(orderedPageIds[orderedIndex++])!
      : page,
  );

  return {
    kind: "mutation",
    pages: normalized(next),
    paginationDisabledPageIds: [],
  };
}

function assertNoCycle(
  pages: ReadonlyArray<DraftStructurePage>,
  pageId: string,
  parentId: string,
): void {
  const byId = pageById(pages);
  const seen = new Set<string>();
  let cursor: string | null = parentId;

  while (cursor !== null) {
    if (cursor === pageId || seen.has(cursor)) {
      fail(ERROR_CODES.PAGE_HIERARCHY_CYCLE);
    }
    seen.add(cursor);
    cursor = byId.get(cursor)?.parentId ?? null;
  }
}

export function planMoveDraftPage(args: {
  pages: ReadonlyArray<DraftStructurePage>;
  pageId: string;
  parentId: string | null;
}): DraftStructurePlan {
  const { pages, pageId, parentId } = args;
  const current = pageById(pages).get(pageId);

  if (!current) fail(ERROR_CODES.PAGE_NOT_FOUND);
  if (parentId === pageId) fail(ERROR_CODES.PAGE_HIERARCHY_CYCLE);
  if (current.slug === HOME_SLUG && parentId !== null) {
    fail(ERROR_CODES.PAGE_PARENT_INVALID);
  }
  if (current.parentId === parentId) {
    const disablePagination = parentId === null && current.paginationEnabled;
    return {
      kind: "noop",
      pages: disablePagination
        ? pages.map((page) =>
            page.id === pageId
              ? { ...page, paginationEnabled: false }
              : page,
          )
        : pages,
      paginationDisabledPageIds: disablePagination ? [pageId] : [],
    };
  }

  if (parentId !== null) {
    const parent = pageById(pages).get(parentId);
    if (!parent) fail(ERROR_CODES.PAGE_NOT_FOUND);
    assertNoCycle(pages, pageId, parentId);
    if (parent.parentId !== null) fail(ERROR_CODES.PAGE_PARENT_INVALID);
  }

  const hasChildren = pages.some((page) => page.parentId === pageId);
  if (parentId !== null && hasChildren) fail(ERROR_CODES.PAGE_PARENT_INVALID);

  const without = pages.filter((page) => page.id !== pageId);
  const disablePagination = parentId === null && current.paginationEnabled;
  const moved = {
    ...current,
    parentId,
    ...(parentId === null ? { paginationEnabled: false } : {}),
  };
  without.splice(insertionIndexAtSiblingEnd(without, parentId), 0, moved);

  return {
    kind: "mutation",
    pages: normalized(without),
    paginationDisabledPageIds: disablePagination ? [pageId] : [],
  };
}

export function planDeleteDraftPage(args: {
  pages: ReadonlyArray<DraftStructurePage>;
  pageId: string;
}): DraftStructureMutationPlan {
  const target = pageById(args.pages).get(args.pageId);
  if (!target) fail(ERROR_CODES.PAGE_NOT_FOUND);

  const paginationDisabledPageIds: string[] = [];
  const next = args.pages
    .filter((page) => page.id !== args.pageId)
    .map((page) => {
      if (page.parentId !== args.pageId) return page;

      if (page.paginationEnabled) paginationDisabledPageIds.push(page.id);

      return {
        ...page,
        parentId: null,
        paginationEnabled: false,
        metaRevision: page.metaRevision + (page.paginationEnabled ? 1 : 0),
      };
    });

  return {
    kind: "mutation",
    pages: normalized(next),
    paginationDisabledPageIds,
  };
}
