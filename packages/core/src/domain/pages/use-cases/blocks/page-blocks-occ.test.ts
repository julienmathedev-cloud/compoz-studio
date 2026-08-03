/**
 * @file packages/core/src/domain/pages/use-cases/blocks/page-blocks-occ.test.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Shared executor and operation-level OCC tests for draft Page blocks.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { PageWithRevisions } from "@compoz/core/domain/pages/entities/page";
import type {
  CompareAndSetDraftPageBlocksInput,
  PagesRepository,
} from "@compoz/core/domain/pages/ports/pages-repository";
import { createSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/create-section-block";
import { deleteBlock } from "@compoz/core/domain/pages/use-cases/blocks/delete-block";
import { reorderBlocks } from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks";
import { updateSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block";

function section(id: string, name = id): Block {
  return {
    id,
    type: "section",
    name,
    containerMode: "contained",
    lcpPriority: false,
    rows: [],
  };
}

function headingSection(
  id: string,
  level: "h1" | "h2",
): Block {
  return {
    ...section(id),
    rows: [{
      id: `row-${id}`,
      columnsCount: 1,
      reverseOn: { mobile: false, tablet: false, desktop: false },
      columns: [{
        id: `column-${id}`,
        cells: [{
          id: `heading-${id}`,
          kind: "heading",
          level,
          title: id,
          subtitle: null,
          align: "left",
          variant: "default",
          separator: false,
          idAnchor: null,
          reveal: false,
          highlights: [],
        }],
      }],
    }],
  };
}

class MemoryPages implements PagesRepository {
  revision = 0;
  blocks: ReadonlyArray<Block>;
  casCalls: CompareAndSetDraftPageBlocksInput[] = [];
  reads = 0;
  casFailures = 0;

  constructor(blocks: ReadonlyArray<Block>) {
    this.blocks = blocks;
  }

  async ensureBase() {}
  async readByIdWithRevisions(): Promise<PageWithRevisions> {
    this.reads++;
    return {
      page: {
        id: "page",
        parentId: "parent",
        slug: "page",
        name: "Metadata",
        seoTitle: null,
        seoDescription: null,
        blocks: this.blocks,
        sitemap: null,
        paginationEnabled: false,
        meta: { createdAt: "created", updatedAt: "unchanged" },
      },
      revisions: { metaRevision: 9, blocksRevision: this.revision },
    };
  }
  async compareAndSetDraftPageBlocks(input: CompareAndSetDraftPageBlocksInput) {
    this.casCalls.push(input);
    if (this.casFailures > 0) {
      this.casFailures--;
      return false;
    }
    if (input.expectedBlocksRevision !== this.revision) return false;
    this.blocks = input.blocks;
    this.revision++;
    return true;
  }
  async readById() { return (await this.readByIdWithRevisions()).page; }
  async readBySlug() { return null; }
  async readManyById() { return []; }
  async readManySitemapMetadataById() { return []; }
  async existsById() { return false; }
  async existsBySlug() { return false; }
}

function errorCode(error: unknown): string | undefined {
  return error instanceof DomainError ? error.code : undefined;
}

function hasConflictKind(error: unknown, kind: string): boolean {
  if (!(error instanceof DomainError)) return false;
  const details = error.details;
  if (!details || typeof details !== "object") return false;
  const conflicts = (details as { conflicts?: unknown }).conflicts;
  return (
    Array.isArray(conflicts) &&
    conflicts.some(
      (conflict) =>
        conflict !== null &&
        typeof conflict === "object" &&
        (conflict as { kind?: unknown }).kind === kind,
    )
  );
}

void test("create generates its block ID once, retries CAS, and returns revisioned outcome", async () => {
  const pages = new MemoryPages([section("a")]);
  pages.revision = 2;
  pages.casFailures = 1;
  let generated = 0;
  const run = createSectionBlock({
    pages,
    idGenerator: { nextId: () => `new-${++generated}` },
    nowIso: () => "now",
  });
  const result = await run({
    pageId: "page",
    expectedBlocksRevision: 2,
    baselineOrder: ["a"],
    baselineLcpPriorityBlockId: null,
    placement: { kind: "end" },
    containerMode: "contained",
    lcpPriority: false,
    rows: [],
  });
  assert.equal(result.outcome, "updated");
  assert.equal(result.blocksRevision, 3);
  assert.equal(result.createdBlockId, "new-1");
  assert.equal(generated, 1);
  assert.equal(pages.casCalls.length, 2);
  assert.deepEqual(pages.blocks.map((block) => block.id), ["a", "new-1"]);
});

void test("end placement appends after concurrent creates in the saved order", async () => {
  async function createAfter(remoteId: string, localId: string) {
    const pages = new MemoryPages([section("a"), section(remoteId)]);
    pages.revision = 1;
    const result = await createSectionBlock({
      pages,
      idGenerator: { nextId: () => localId },
    })({
      pageId: "page",
      expectedBlocksRevision: 0,
      baselineOrder: ["a"],
      baselineLcpPriorityBlockId: null,
      placement: { kind: "end" },
      containerMode: "contained",
      lcpPriority: false,
      rows: [],
    });
    return result.blocks.map((block) => block.id);
  }
  assert.deepEqual(await createAfter("z", "b"), ["a", "z", "b"]);
  assert.deepEqual(await createAfter("b", "z"), ["a", "b", "z"]);
});

void test("end placement succeeds after the last baseline block was deleted", async () => {
  const pages = new MemoryPages([section("a")]);
  pages.revision = 1;
  const result = await createSectionBlock({
    pages,
    idGenerator: { nextId: () => "local" },
  })({
    pageId: "page",
    expectedBlocksRevision: 0,
    baselineOrder: ["a", "b"],
    baselineLcpPriorityBlockId: null,
    placement: { kind: "end" },
    containerMode: "contained",
    lcpPriority: false,
    rows: [],
  });

  assert.equal(result.outcome, "updated");
  assert.deepEqual(result.blocks.map((block) => block.id), ["a", "local"]);
});

void test("missing create anchor and concurrent LCP activation are functional conflicts", async () => {
  const missingAnchor = new MemoryPages([section("other")]);
  await assert.rejects(
    createSectionBlock({
      pages: missingAnchor,
      idGenerator: { nextId: () => "new" },
    })({
      pageId: "page",
      expectedBlocksRevision: 0,
      baselineOrder: ["gone"],
      baselineLcpPriorityBlockId: null,
      placement: { kind: "after", blockId: "gone" },
      containerMode: "contained",
      lcpPriority: false,
      rows: [],
    }),
    (error) =>
      errorCode(error) === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT &&
      hasConflictKind(error, "anchorMissing"),
  );

  const movedAnchor = new MemoryPages([
    section("b"),
    section("a"),
    section("c"),
  ]);
  movedAnchor.revision = 1;
  await assert.rejects(
    createSectionBlock({
      pages: movedAnchor,
      idGenerator: { nextId: () => "new" },
    })({
      pageId: "page",
      expectedBlocksRevision: 0,
      baselineOrder: ["a", "b", "c"],
      baselineLcpPriorityBlockId: null,
      placement: { kind: "after", blockId: "a" },
      containerMode: "contained",
      lcpPriority: false,
      rows: [],
    }),
    (error) =>
      errorCode(error) === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT &&
      hasConflictKind(error, "orderIncompatible"),
  );

  const owner = { ...section("remote-owner"), lcpPriority: true };
  const concurrentLcp = new MemoryPages([owner]);
  concurrentLcp.revision = 1;
  await assert.rejects(
    createSectionBlock({
      pages: concurrentLcp,
      idGenerator: { nextId: () => "new-owner" },
    })({
      pageId: "page",
      expectedBlocksRevision: 0,
      baselineOrder: [],
      baselineLcpPriorityBlockId: null,
      placement: { kind: "end" },
      containerMode: "contained",
      lcpPriority: true,
      rows: [],
    }),
    (error) => errorCode(error) === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
  );
});

void test("missing, stale mergeable, and future revisions follow the common protocol", async () => {
  const pages = new MemoryPages([section("a", "Remote"), section("b")]);
  pages.revision = 4;
  const update = updateSectionBlock({ pages });

  await assert.rejects(
    update({
      pageId: "page",
      blockId: "a",
      expectedBlocksRevision: undefined as unknown as number,
      baselineLcpPriorityBlockId: null,
      changes: {},
    }),
    (error) => errorCode(error) === ERROR_CODES.REVISION_REQUIRED,
  );

  const stale = await update({
    pageId: "page",
    blockId: "a",
    expectedBlocksRevision: 2,
    baselineLcpPriorityBlockId: null,
    changes: {
      containerMode: { baseline: "contained", local: "fullBleed" },
    },
  });
  assert.equal(stale.outcome, "updated");
  assert.equal(stale.blocks[0]?.name, "Remote");
  assert.equal(stale.blocks[0]?.containerMode, "fullBleed");

  await assert.rejects(
    update({
      pageId: "page",
      blockId: "a",
      expectedBlocksRevision: 99,
      baselineLcpPriorityBlockId: null,
      changes: {},
    }),
    (error) => errorCode(error) === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
  );
});

void test("same final state is a no-op without CAS or revision increment", async () => {
  const pages = new MemoryPages([section("a", "Final")]);
  pages.revision = 3;
  const result = await updateSectionBlock({ pages })({
    pageId: "page",
    blockId: "a",
    expectedBlocksRevision: 2,
    baselineLcpPriorityBlockId: null,
    changes: { name: { baseline: "Before", local: "Final" } },
  });
  assert.equal(result.outcome, "noChanges");
  assert.equal(result.blocksRevision, 3);
  assert.equal(pages.casCalls.length, 0);
});

void test("update reports remote deletion, concurrent LCP, and merged H1 invariant conflicts", async () => {
  const deleted = new MemoryPages([]);
  await assert.rejects(
    updateSectionBlock({ pages: deleted })({
      pageId: "page",
      blockId: "gone",
      expectedBlocksRevision: 0,
      baselineLcpPriorityBlockId: null,
      changes: { name: { baseline: "Before", local: "Local" } },
    }),
    (error) => errorCode(error) === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
  );

  const remoteOwner = { ...section("owner"), lcpPriority: true };
  const lcp = new MemoryPages([section("target"), remoteOwner]);
  lcp.revision = 1;
  await assert.rejects(
    updateSectionBlock({ pages: lcp })({
      pageId: "page",
      blockId: "target",
      expectedBlocksRevision: 0,
      baselineLcpPriorityBlockId: null,
      changes: { lcpPriority: { baseline: false, local: true } },
    }),
    (error) => errorCode(error) === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
  );

  const h1 = new MemoryPages([
    headingSection("target", "h2"),
    headingSection("remote", "h1"),
  ]);
  h1.revision = 1;
  const baselineRows = headingSection("target", "h2").rows;
  const localRows = headingSection("target", "h1").rows;
  await assert.rejects(
    updateSectionBlock({ pages: h1 })({
      pageId: "page",
      blockId: "target",
      expectedBlocksRevision: 0,
      baselineLcpPriorityBlockId: null,
      changes: { rows: { baseline: baselineRows, local: localRows } },
    }),
    (error) => {
      if (!(error instanceof DomainError)) return false;
      const details = error.details as {
        conflicts?: ReadonlyArray<{ kind?: string }>;
      };
      return details.conflicts?.some(
        (conflict) => conflict.kind === "globalInvariant",
      ) === true;
    },
  );
});

void test("three lost CAS attempts perform a final read and expose contention", async () => {
  const pages = new MemoryPages([section("a")]);
  pages.casFailures = 3;
  await assert.rejects(
    updateSectionBlock({ pages })({
      pageId: "page",
      blockId: "a",
      expectedBlocksRevision: 0,
      baselineLcpPriorityBlockId: null,
      changes: { name: { baseline: "a", local: "local" } },
    }),
    (error) => {
      if (!(error instanceof DomainError)) return false;
      const details = error.details as { conflictKind?: string };
      return (
        error.code === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT &&
        details.conflictKind === "contention"
      );
    },
  );
  assert.equal(pages.casCalls.length, 3);
  assert.equal(pages.reads, 4);
});

void test("delete converges when absent, ignores movement, and conflicts with remote content", async () => {
  const baseline = section("a");
  const absent = new MemoryPages([section("b")]);
  absent.revision = 2;
  const noChanges = await deleteBlock({ pages: absent })({
    pageId: "page",
    blockId: "a",
    expectedBlocksRevision: 1,
    baselineBlock: baseline,
  });
  assert.equal(noChanges.outcome, "noChanges");

  const moved = new MemoryPages([section("b"), baseline]);
  const removed = await deleteBlock({ pages: moved })({
    pageId: "page",
    blockId: "a",
    expectedBlocksRevision: 0,
    baselineBlock: baseline,
  });
  assert.deepEqual(removed.blocks.map((block) => block.id), ["b"]);

  const changed = new MemoryPages([section("a", "remote")]);
  await assert.rejects(
    deleteBlock({ pages: changed })({
      pageId: "page",
      blockId: "a",
      expectedBlocksRevision: 0,
      baselineBlock: baseline,
    }),
    (error) => errorCode(error) === ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
  );
});

void test("reorder merges against content changes and remote add/delete", async () => {
  const pages = new MemoryPages([
    section("a", "remote content"),
    section("b"),
    section("remote"),
  ]);
  pages.revision = 3;
  const result = await reorderBlocks({ pages })({
    pageId: "page",
    expectedBlocksRevision: 1,
    baselineOrder: ["a", "b", "deleted"],
    localOrder: ["b", "a", "deleted"],
  });
  assert.equal(result.outcome, "updated");
  assert.equal(result.blocks.some((block) => block.id === "remote"), true);
  assert.equal(result.blocks.find((block) => block.id === "a")?.name, "remote content");
});
