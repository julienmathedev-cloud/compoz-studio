/**
 * @file packages/core/src/domain/pages/structure/draft-structure-planner.test.ts
 * @layer core/domain/pages
 * @description Pure tests for hierarchy, ordering, deletion, and normalization plans.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { DomainError } from "@compoz/core/domain/errors/domain-error";
import {
  planCreateDraftPage,
  planDeleteDraftPage,
  planMoveDraftPage,
  planReorderDraftSiblings,
  type DraftStructurePage,
} from "@compoz/core/domain/pages/structure/draft-structure-planner";

const page = (
  id: string,
  parentId: string | null,
  position: number,
  overrides: Partial<DraftStructurePage> = {},
): DraftStructurePage => ({
  id,
  parentId,
  position,
  slug: id,
  paginationEnabled: false,
  metaRevision: 0,
  ...overrides,
});

function code(error: unknown): string | undefined {
  return error instanceof DomainError ? error.code : undefined;
}

void test("creation inserts at sibling end and normalizes global positions", () => {
  const plan = planCreateDraftPage({
    pages: [page("root-a", null, 4), page("child-a", "root-a", 9)],
    page: page("child-b", "root-a", 20),
  });

  assert.deepEqual(
    plan.pages.map(({ id, position }) => [id, position]),
    [
      ["root-a", 0],
      ["child-a", 1],
      ["child-b", 2],
    ],
  );
  assert.equal(plan.pages[2]?.metaRevision, 0);
});

void test("creation and moves normalize root pagination", () => {
  const created = planCreateDraftPage({
    pages: [],
    page: page("root", null, 0, { paginationEnabled: true }),
  });
  assert.equal(created.pages[0]?.paginationEnabled, false);

  const moved = planMoveDraftPage({
    pages: [
      page("parent", null, 0),
      page("child", "parent", 1, { paginationEnabled: true }),
    ],
    pageId: "child",
    parentId: null,
  });
  assert.equal(moved.pages[1]?.paginationEnabled, false);
  assert.deepEqual(moved.paginationDisabledPageIds, ["child"]);
});

void test("an effective home is rejected even when its parent is unchanged", () => {
  assert.throws(
    () =>
      planMoveDraftPage({
        pages: [page("candidate", "parent", 0, { slug: "home" })],
        pageId: "candidate",
        parentId: "parent",
      }),
    (error) => code(error) === "PAGE_PARENT_INVALID",
  );
});

void test("creation rejects an absent parent and a parent that is already a child", () => {
  const pages = [page("root", null, 0), page("child", "root", 1)];
  assert.throws(
    () =>
      planCreateDraftPage({
        pages,
        page: page("new", "missing", 2),
      }),
    (error) => code(error) === "PAGE_NOT_FOUND",
  );
  assert.throws(
    () =>
      planCreateDraftPage({
        pages,
        page: page("new", "child", 2),
      }),
    (error) => code(error) === "PAGE_PARENT_INVALID",
  );
});

void test("reorder validates an exhaustive permutation and preserves non-sibling slots", () => {
  const pages = [
    page("root", null, 7),
    page("a", "root", 8),
    page("other", null, 9),
    page("b", "root", 10),
  ];
  const plan = planReorderDraftSiblings({
    pages,
    parentId: "root",
    orderedPageIds: ["b", "a"],
  });

  assert.equal(plan.kind, "mutation");
  assert.deepEqual(
    plan.pages.map((item) => item.id),
    ["root", "b", "other", "a"],
  );
  assert.deepEqual(
    plan.pages.map((item) => item.position),
    [0, 1, 2, 3],
  );
});

void test("identical and empty-empty reorder are explicit no-ops", () => {
  const pages = [page("root", null, 0), page("a", "root", 1)];
  assert.equal(
    planReorderDraftSiblings({
      pages,
      parentId: "root",
      orderedPageIds: ["a"],
    }).kind,
    "noop",
  );
  assert.equal(
    planReorderDraftSiblings({
      pages: [...pages, page("empty", null, 2)],
      parentId: "empty",
      orderedPageIds: [],
    }).kind,
    "noop",
  );
});

void test("reorder rejects an inaccessible or non-root parent", () => {
  const pages = [page("root", null, 0), page("child", "root", 1)];
  assert.throws(
    () =>
      planReorderDraftSiblings({
        pages,
        parentId: "missing",
        orderedPageIds: [],
      }),
    (error) => code(error) === "PAGE_NOT_FOUND",
  );
  assert.throws(
    () =>
      planReorderDraftSiblings({
        pages,
        parentId: "child",
        orderedPageIds: [],
      }),
    (error) => code(error) === "PAGE_PARENT_INVALID",
  );
});

for (const orderedPageIds of [
  ["a", "a"],
  [],
  ["a", "missing"],
  ["a", "other"],
]) {
  void test(`invalid reorder ${JSON.stringify(orderedPageIds)} is rejected`, () => {
    const pages = [
      page("root", null, 0),
      page("a", "root", 1),
      page("b", "root", 2),
      page("other", null, 3),
    ];
    assert.throws(
      () =>
        planReorderDraftSiblings({
          pages,
          parentId: "root",
          orderedPageIds,
        }),
      (error) => code(error) === "PAGE_REORDER_INVALID",
    );
  });
}

void test("move inserts at the end of the target sibling group", () => {
  const plan = planMoveDraftPage({
    pages: [
      page("root-a", null, 0),
      page("child-a", "root-a", 1),
      page("root-b", null, 2),
      page("moving", null, 3),
    ],
    pageId: "moving",
    parentId: "root-a",
  });

  assert.equal(plan.kind, "mutation");
  assert.deepEqual(
    plan.pages.map((item) => [item.id, item.parentId]),
    [
      ["root-a", null],
      ["child-a", "root-a"],
      ["moving", "root-a"],
      ["root-b", null],
    ],
  );
});

void test("move rejects self/cycles, child parents, home nesting, and nesting a parent", () => {
  const pages = [
    page("home", null, 0, { slug: "home" }),
    page("root", null, 1),
    page("child", "root", 2),
    page("parent-with-child", null, 3),
    page("grandchild", "parent-with-child", 4),
  ];

  for (const [pageId, parentId, expected] of [
    ["root", "root", "PAGE_HIERARCHY_CYCLE"],
    ["home", "root", "PAGE_PARENT_INVALID"],
    ["root", "child", "PAGE_HIERARCHY_CYCLE"],
    ["parent-with-child", "root", "PAGE_PARENT_INVALID"],
  ] as const) {
    assert.throws(
      () => planMoveDraftPage({ pages, pageId, parentId }),
      (error) => code(error) === expected,
    );
  }
});

void test("move detects a transitive cycle defensively before the depth check", () => {
  const pages = [
    page("moving", null, 0),
    page("middle", "moving", 1),
    page("leaf", "middle", 2),
  ];
  assert.throws(
    () =>
      planMoveDraftPage({
        pages,
        pageId: "moving",
        parentId: "leaf",
      }),
    (error) => code(error) === "PAGE_HIERARCHY_CYCLE",
  );
});

void test("delete detaches children, fixes pagination selectively, and normalizes", () => {
  const plan = planDeleteDraftPage({
    pages: [
      page("target", null, 3),
      page("paginated", "target", 8, {
        paginationEnabled: true,
        metaRevision: 4,
      }),
      page("plain", "target", 10, { metaRevision: 7 }),
    ],
    pageId: "target",
  });

  assert.deepEqual(plan.paginationDisabledPageIds, ["paginated"]);
  assert.deepEqual(
    plan.pages.map((item) => ({
      id: item.id,
      parentId: item.parentId,
      paginationEnabled: item.paginationEnabled,
      metaRevision: item.metaRevision,
      position: item.position,
    })),
    [
      {
        id: "paginated",
        parentId: null,
        paginationEnabled: false,
        metaRevision: 5,
        position: 0,
      },
      {
        id: "plain",
        parentId: null,
        paginationEnabled: false,
        metaRevision: 7,
        position: 1,
      },
    ],
  );
});

void test("home is deletable and an unknown target is not idempotent", () => {
  const pages = [page("home", null, 0, { slug: "home" })];
  assert.deepEqual(
    planDeleteDraftPage({ pages, pageId: "home" }).pages,
    [],
  );
  assert.throws(
    () => planDeleteDraftPage({ pages, pageId: "missing" }),
    (error) => code(error) === "PAGE_NOT_FOUND",
  );
});
