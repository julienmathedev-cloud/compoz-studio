/**
 * @file packages/infra/src/pages/prisma-page-blocks-occ.postgres.test.ts
 * @layer infra/pages
 * @description Opt-in real PostgreSQL proof for Page block CAS and Website isolation.
 * @remarks Refuses every database except the explicitly dedicated compoz_occ_blocks_test database.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { CompareAndSetDraftPageBlocksInput } from "@compoz/core/domain/pages/ports/pages-repository";
import { createSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/create-section-block";
import { deleteBlock } from "@compoz/core/domain/pages/use-cases/blocks/delete-block";
import { reorderBlocks } from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks";
import { updateSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";
import { PrismaClient } from "@compoz/infra/prisma/generated";

const EXPECTED_DATABASE = "compoz_occ_blocks_test";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL?.trim() ?? "";

function isDedicatedDatabase(value: string): boolean {
  if (!value) return false;
  try {
    const database = new URL(value).pathname.replace(/^\/+/, "");
    return database === EXPECTED_DATABASE;
  } catch {
    return false;
  }
}

if (TEST_DATABASE_URL && !isDedicatedDatabase(TEST_DATABASE_URL)) {
  throw new Error(
    `TEST_DATABASE_URL must target the dedicated ${EXPECTED_DATABASE} database.`,
  );
}
if (
  TEST_DATABASE_URL &&
  process.env.DATABASE_URL &&
  !isDedicatedDatabase(process.env.DATABASE_URL)
) {
  throw new Error(
    `DATABASE_URL must target the dedicated ${EXPECTED_DATABASE} database while this harness runs.`,
  );
}

const skip = TEST_DATABASE_URL
  ? false
  : `TEST_DATABASE_URL is not configured for ${EXPECTED_DATABASE}; PostgreSQL proof was not run.`;

function client(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
    log: ["error"],
  });
}

function repositoryWithCas(
  delegate: PagesRepository,
  compareAndSetDraftPageBlocks: (
    input: CompareAndSetDraftPageBlocksInput,
  ) => Promise<boolean>,
): PagesRepository {
  return {
    ensureBase: () => delegate.ensureBase(),
    readById: (state, pageId) => delegate.readById(state, pageId),
    readByIdWithRevisions: (state, pageId) =>
      delegate.readByIdWithRevisions(state, pageId),
    readBySlug: (state, slug) => delegate.readBySlug(state, slug),
    readManyById: (state, pageIds) => delegate.readManyById(state, pageIds),
    readManySitemapMetadataById: (state, pageIds) =>
      delegate.readManySitemapMetadataById(state, pageIds),
    compareAndSetDraftPageBlocks,
    existsById: (state, pageId) => delegate.existsById(state, pageId),
    existsBySlug: (state, slug) => delegate.existsBySlug(state, slug),
  };
}

function synchronizedFirstRead(
  delegates: ReadonlyArray<PagesRepository>,
): ReadonlyArray<PagesRepository> {
  let arrived = 0;
  let release: (() => void) | undefined;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });

  return delegates.map((delegate) => {
    let firstRead = true;
    return {
      ...repositoryWithCas(
        delegate,
        (input) => delegate.compareAndSetDraftPageBlocks(input),
      ),
      readByIdWithRevisions: async (state, pageId) => {
        const result = await delegate.readByIdWithRevisions(state, pageId);
        if (firstRead) {
          firstRead = false;
          arrived++;
          if (arrived === delegates.length) release?.();
          await ready;
        }
        return result;
      },
    };
  });
}

function controlledFirstCommit(
  delegates: ReadonlyArray<PagesRepository>,
  firstIndex: number,
): ReadonlyArray<PagesRepository> {
  let release: (() => void) | undefined;
  const firstCommitted = new Promise<void>((resolve) => {
    release = resolve;
  });

  return delegates.map((delegate, index) => {
    let firstCas = true;
    return repositoryWithCas(delegate, async (input) => {
      if (!firstCas) {
        return delegate.compareAndSetDraftPageBlocks(input);
      }
      firstCas = false;
      if (index !== firstIndex) await firstCommitted;
      try {
        return await delegate.compareAndSetDraftPageBlocks(input);
      } finally {
        if (index === firstIndex) release?.();
      }
    });
  });
}

function rejectFirstCasAttempts(
  delegate: PagesRepository,
  attempts: number,
): PagesRepository {
  let remaining = attempts;
  return repositoryWithCas(delegate, async (input) => {
    if (remaining > 0) {
      remaining--;
      return false;
    }
    return delegate.compareAndSetDraftPageBlocks(input);
  });
}

void test(
  "real CAS increments only blocksRevision and never crosses Website scope",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteA = `occ-blocks-a-${suffix}`;
    const websiteB = `occ-blocks-b-${suffix}`;
    const pageId = `page-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");

    try {
      for (const websiteId of [websiteA, websiteB]) {
        await prisma.website.create({
          data: {
            id: websiteId,
            slug: websiteId,
            name: websiteId,
            type: "site",
            pages: {
              create: {
                state: "draft",
                pageId,
                position: 0,
                parentPageId: null,
                slug: pageId,
                name: `metadata-${websiteId}`,
                seoTitle: null,
                seoDescription: null,
                blocks: [],
                paginationEnabled: false,
                metaRevision: 7,
                blocksRevision: 0,
                metaCreatedAt: at,
                metaUpdatedAt: at,
              },
            },
          },
        });
      }

      const repository = new PrismaPagesRepository({
        websiteId: websiteA,
        client: prisma,
      });
      const block = {
        id: "block-a",
        type: "section" as const,
        name: "Block",
        containerMode: "contained" as const,
        lcpPriority: false,
        rows: [],
      };
      assert.equal(
        await repository.compareAndSetDraftPageBlocks({
          pageId,
          expectedBlocksRevision: 0,
          blocks: [block],
          metaUpdatedAt: "2026-07-30T11:00:00.000Z",
        }),
        true,
      );
      assert.equal(
        await repository.compareAndSetDraftPageBlocks({
          pageId,
          expectedBlocksRevision: 0,
          blocks: [],
          metaUpdatedAt: "2026-07-30T12:00:00.000Z",
        }),
        false,
      );

      const [rowA, rowB] = await Promise.all([
        prisma.page.findUniqueOrThrow({
          where: {
            websiteId_state_pageId: {
              websiteId: websiteA,
              state: "draft",
              pageId,
            },
          },
        }),
        prisma.page.findUniqueOrThrow({
          where: {
            websiteId_state_pageId: {
              websiteId: websiteB,
              state: "draft",
              pageId,
            },
          },
        }),
      ]);
      const persistedWebsiteA = await prisma.website.findUniqueOrThrow({
        where: { id: websiteA },
      });
      assert.equal(rowA.blocksRevision, 1);
      assert.equal(rowA.metaRevision, 7);
      assert.equal(rowA.name, `metadata-${websiteA}`);
      assert.equal(rowA.parentPageId, null);
      assert.equal(rowA.position, 0);
      assert.equal(rowA.seoTitle, null);
      assert.equal(rowA.seoDescription, null);
      assert.equal(persistedWebsiteA.draftStructureRevision, 0);
      assert.equal(rowB.blocksRevision, 0);
      assert.deepEqual(rowB.blocks, []);
    } finally {
      await prisma.website.deleteMany({
        where: { id: { in: [websiteA, websiteB] } },
      });
      await prisma.$disconnect();
    }
  },
);

void test(
  "real concurrent use cases merge independent properties of the same block",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteId = `occ-blocks-race-${suffix}`;
    const pageId = `page-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");
    const blocks = ["a", "b"].map((id) => ({
      id,
      type: "section" as const,
      name: id.toUpperCase(),
      containerMode: "contained" as const,
      lcpPriority: false,
      rows: [],
    }));

    try {
      await prisma.website.create({
        data: {
          id: websiteId,
          slug: websiteId,
          name: websiteId,
          type: "site",
          pages: {
            create: {
              state: "draft",
              pageId,
              position: 0,
              parentPageId: null,
              slug: pageId,
              name: "metadata",
              seoTitle: null,
              seoDescription: null,
              blocks,
              paginationEnabled: false,
              metaRevision: 11,
              blocksRevision: 0,
              metaCreatedAt: at,
              metaUpdatedAt: at,
            },
          },
        },
      });

      const synchronized = synchronizedFirstRead([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ]);
      const [left, right] = await Promise.all([
        updateSectionBlock({ pages: synchronized[0]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: { name: { baseline: "A", local: "A local" } },
        }),
        updateSectionBlock({ pages: synchronized[1]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: {
            containerMode: {
              baseline: "contained",
              local: "fullBleed",
            },
          },
        }),
      ]);
      assert.equal(left.outcome, "updated");
      assert.equal(right.outcome, "updated");

      const row = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      const persisted = row.blocks as typeof blocks;
      assert.equal(row.blocksRevision, 2);
      assert.equal(row.metaRevision, 11);
      assert.equal(row.name, "metadata");
      assert.equal(row.parentPageId, null);
      assert.equal(persisted.find((block) => block.id === "a")?.name, "A local");
      assert.equal(
        persisted.find((block) => block.id === "a")?.containerMode,
        "fullBleed",
      );
      assert.equal(persisted.find((block) => block.id === "b")?.name, "B");
    } finally {
      await prisma.website.deleteMany({ where: { id: websiteId } });
      await prisma.$disconnect();
    }
  },
);

void test(
  "real same-field races converge on equal finals and reject divergent finals",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteId = `occ-blocks-field-${suffix}`;
    const pageId = `page-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");
    const initialBlock = {
      id: "a",
      type: "section" as const,
      name: "A",
      containerMode: "contained" as const,
      lcpPriority: false,
      rows: [],
    };

    const runRace = async (leftName: string, rightName: string) => {
      const synchronized = synchronizedFirstRead([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ]);
      return Promise.allSettled([
        updateSectionBlock({ pages: synchronized[0]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: { name: { baseline: "A", local: leftName } },
        }),
        updateSectionBlock({ pages: synchronized[1]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: { name: { baseline: "A", local: rightName } },
        }),
      ]);
    };

    try {
      await prisma.website.create({
        data: {
          id: websiteId,
          slug: websiteId,
          name: websiteId,
          type: "site",
          pages: {
            create: {
              state: "draft",
              pageId,
              position: 0,
              parentPageId: null,
              slug: pageId,
              name: "metadata",
              seoTitle: null,
              seoDescription: null,
              blocks: [initialBlock],
              paginationEnabled: false,
              metaRevision: 5,
              blocksRevision: 0,
              metaCreatedAt: at,
              metaUpdatedAt: at,
            },
          },
        },
      });

      const converged = await runRace("Final", "Final");
      assert.equal(
        converged.every((result) => result.status === "fulfilled"),
        true,
      );
      const convergedRow = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      assert.equal(convergedRow.blocksRevision, 1);

      await prisma.page.update({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
        data: { blocks: [initialBlock], blocksRevision: 0 },
      });

      const divergent = await runRace("Left", "Right");
      assert.equal(
        divergent.filter((result) => result.status === "fulfilled").length,
        1,
      );
      assert.equal(
        divergent.filter((result) => result.status === "rejected").length,
        1,
      );
      const divergentRow = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      assert.equal(divergentRow.blocksRevision, 1);
      assert.equal(divergentRow.metaRevision, 5);
      assert.equal(divergentRow.name, "metadata");
    } finally {
      await prisma.website.deleteMany({ where: { id: websiteId } });
      await prisma.$disconnect();
    }
  },
);

void test(
  "real same-interval creates converge in both controlled commit orders",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteId = `occ-blocks-create-${suffix}`;
    const pageId = `page-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");
    const initial = ["a", "b"].map((id) => ({
      id,
      type: "section" as const,
      name: id.toUpperCase(),
      containerMode: "contained" as const,
      lcpPriority: false,
      rows: [],
    }));

    const reset = () =>
      prisma.page.update({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
        data: { blocks: initial, blocksRevision: 0 },
      });

    const race = async (firstIndex: number) => {
      await reset();
      const ordered = controlledFirstCommit([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ], firstIndex);
      const synchronized = synchronizedFirstRead(ordered);
      const ids = ["local-z", "local-a"];
      const results = await Promise.all([
        createSectionBlock({
          pages: synchronized[0]!,
          idGenerator: { nextId: () => ids[0]! },
        })({
          pageId,
          expectedBlocksRevision: 0,
          baselineOrder: ["a", "b"],
          baselineLcpPriorityBlockId: null,
          placement: { kind: "after", blockId: "a" },
          containerMode: "contained",
          lcpPriority: false,
          rows: [],
        }),
        createSectionBlock({
          pages: synchronized[1]!,
          idGenerator: { nextId: () => ids[1]! },
        })({
          pageId,
          expectedBlocksRevision: 0,
          baselineOrder: ["a", "b"],
          baselineLcpPriorityBlockId: null,
          placement: { kind: "after", blockId: "a" },
          containerMode: "contained",
          lcpPriority: false,
          rows: [],
        }),
      ]);
      assert.equal(results.every((result) => result.outcome === "updated"), true);
      const row = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      return (row.blocks as typeof initial).map((block) => block.id);
    };

    try {
      await prisma.website.create({
        data: {
          id: websiteId,
          slug: websiteId,
          name: websiteId,
          type: "site",
          pages: {
            create: {
              state: "draft",
              pageId,
              position: 3,
              parentPageId: null,
              slug: pageId,
              name: "metadata",
              seoTitle: "SEO",
              seoDescription: "Description",
              blocks: initial,
              paginationEnabled: false,
              metaRevision: 13,
              blocksRevision: 0,
              metaCreatedAt: at,
              metaUpdatedAt: at,
            },
          },
        },
      });

      assert.deepEqual(await race(0), ["a", "local-a", "local-z", "b"]);
      assert.deepEqual(await race(1), ["a", "local-a", "local-z", "b"]);
    } finally {
      await prisma.website.deleteMany({ where: { id: websiteId } });
      await prisma.$disconnect();
    }
  },
);

void test(
  "delete versus update, a second race, and three lost CAS attempts are explicit",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteId = `occ-blocks-delete-${suffix}`;
    const pageId = `page-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");
    const initial = {
      id: "a",
      type: "section" as const,
      name: "A",
      containerMode: "contained" as const,
      lcpPriority: false,
      rows: [],
    };
    const reset = () =>
      prisma.page.update({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
        data: { blocks: [initial], blocksRevision: 0 },
      });

    try {
      await prisma.website.create({
        data: {
          id: websiteId,
          slug: websiteId,
          name: websiteId,
          type: "site",
          pages: {
            create: {
              state: "draft",
              pageId,
              position: 0,
              parentPageId: null,
              slug: pageId,
              name: "metadata",
              seoTitle: null,
              seoDescription: null,
              blocks: [initial],
              paginationEnabled: false,
              metaRevision: 17,
              blocksRevision: 0,
              metaCreatedAt: at,
              metaUpdatedAt: at,
            },
          },
        },
      });

      const firstRace = synchronizedFirstRead([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ]);
      const deleteAgainstUpdate = await Promise.allSettled([
        deleteBlock({ pages: firstRace[0]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineBlock: initial,
        }),
        updateSectionBlock({ pages: firstRace[1]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: { name: { baseline: "A", local: "Updated" } },
        }),
      ]);
      assert.equal(
        deleteAgainstUpdate.filter((result) => result.status === "fulfilled")
          .length,
        1,
      );
      assert.equal(
        deleteAgainstUpdate.filter((result) => result.status === "rejected")
          .length,
        1,
      );

      await reset();
      const secondRace = synchronizedFirstRead([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ]);
      const resolvedAgain = await Promise.all([
        updateSectionBlock({ pages: secondRace[0]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: { name: { baseline: "A", local: "Second race" } },
        }),
        updateSectionBlock({ pages: secondRace[1]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: {
            containerMode: {
              baseline: "contained",
              local: "fullBleed",
            },
          },
        }),
      ]);
      assert.equal(resolvedAgain.every((result) => result.outcome === "updated"), true);

      await reset();
      const contentionRepository = rejectFirstCasAttempts(
        new PrismaPagesRepository({ websiteId, client: prisma }),
        3,
      );
      await assert.rejects(
        updateSectionBlock({ pages: contentionRepository })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: { name: { baseline: "A", local: "Never persisted" } },
        }),
      );
      const afterContention = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      assert.equal(afterContention.blocksRevision, 0);
      assert.equal(afterContention.metaRevision, 17);
      assert.equal(
        (afterContention.blocks as [typeof initial])[0]?.name,
        "A",
      );
    } finally {
      await prisma.website.deleteMany({ where: { id: websiteId } });
      await prisma.$disconnect();
    }
  },
);

void test(
  "reorder races with content, create, and delete without losing persisted IDs",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteId = `occ-blocks-reorder-${suffix}`;
    const pageId = `page-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");
    const initial = ["a", "b"].map((id) => ({
      id,
      type: "section" as const,
      name: id.toUpperCase(),
      containerMode: "contained" as const,
      lcpPriority: false,
      rows: [],
    }));
    const reset = () =>
      prisma.page.update({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
        data: { blocks: initial, blocksRevision: 0 },
      });
    const readOrder = async () => {
      const row = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      return (row.blocks as typeof initial).map((block) => block.id);
    };

    try {
      await prisma.website.create({
        data: {
          id: websiteId,
          slug: websiteId,
          name: websiteId,
          type: "site",
          pages: {
            create: {
              state: "draft",
              pageId,
              position: 0,
              parentPageId: null,
              slug: pageId,
              name: "metadata",
              seoTitle: null,
              seoDescription: null,
              blocks: initial,
              paginationEnabled: false,
              metaRevision: 19,
              blocksRevision: 0,
              metaCreatedAt: at,
              metaUpdatedAt: at,
            },
          },
        },
      });

      const contentRace = synchronizedFirstRead([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ]);
      const contentResults = await Promise.all([
        reorderBlocks({ pages: contentRace[0]! })({
          pageId,
          expectedBlocksRevision: 0,
          baselineOrder: ["a", "b"],
          localOrder: ["b", "a"],
        }),
        updateSectionBlock({ pages: contentRace[1]! })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: { name: { baseline: "A", local: "Content" } },
        }),
      ]);
      assert.equal(contentResults.every((result) => result.outcome === "updated"), true);
      assert.deepEqual(await readOrder(), ["b", "a"]);

      await reset();
      const createRace = synchronizedFirstRead(controlledFirstCommit([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ], 0));
      const reorderAgainstCreate = await Promise.allSettled([
        reorderBlocks({ pages: createRace[0]! })({
          pageId,
          expectedBlocksRevision: 0,
          baselineOrder: ["a", "b"],
          localOrder: ["b", "a"],
        }),
        createSectionBlock({
          pages: createRace[1]!,
          idGenerator: { nextId: () => "c" },
        })({
          pageId,
          expectedBlocksRevision: 0,
          baselineOrder: ["a", "b"],
          baselineLcpPriorityBlockId: null,
          placement: { kind: "after", blockId: "a" },
          containerMode: "contained",
          lcpPriority: false,
          rows: [],
        }),
      ]);
      assert.equal(
        reorderAgainstCreate.filter((result) => result.status === "fulfilled")
          .length,
        1,
      );
      assert.deepEqual(new Set(await readOrder()), new Set(["a", "b"]));

      await reset();
      const deleteRace = synchronizedFirstRead(controlledFirstCommit([
        new PrismaPagesRepository({ websiteId, client: prisma }),
        new PrismaPagesRepository({ websiteId, client: prisma }),
      ], 1));
      const reorderAgainstDelete = await Promise.all([
        reorderBlocks({ pages: deleteRace[0]! })({
          pageId,
          expectedBlocksRevision: 0,
          baselineOrder: ["a", "b"],
          localOrder: ["b", "a"],
        }),
        deleteBlock({ pages: deleteRace[1]! })({
          pageId,
          blockId: "b",
          expectedBlocksRevision: 0,
          baselineBlock: initial[1]!,
        }),
      ]);
      assert.equal(
        reorderAgainstDelete.every((result) =>
          ["updated", "noChanges"].includes(result.outcome)),
        true,
      );
      assert.deepEqual(await readOrder(), ["a"]);

      const finalRow = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      const website = await prisma.website.findUniqueOrThrow({
        where: { id: websiteId },
      });
      assert.equal(finalRow.metaRevision, 19);
      assert.equal(finalRow.name, "metadata");
      assert.equal(finalRow.parentPageId, null);
      assert.equal(finalRow.position, 0);
      assert.equal(website.draftStructureRevision, 0);
    } finally {
      await prisma.website.deleteMany({ where: { id: websiteId } });
      await prisma.$disconnect();
    }
  },
);

void test(
  "a concurrent writer between merge and CAS is re-read and merged before the second CAS",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteId = `occ-blocks-second-cas-${suffix}`;
    const pageId = `page-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");
    const initial = {
      id: "a",
      type: "section" as const,
      name: "A",
      containerMode: "contained" as const,
      lcpPriority: false,
      rows: [],
    };

    try {
      await prisma.website.create({
        data: {
          id: websiteId,
          slug: websiteId,
          name: websiteId,
          type: "site",
          pages: {
            create: {
              state: "draft",
              pageId,
              position: 2,
              parentPageId: null,
              slug: "second-cas",
              name: "metadata",
              seoTitle: "SEO",
              seoDescription: "Description",
              blocks: [initial],
              paginationEnabled: true,
              metaRevision: 23,
              blocksRevision: 0,
              metaCreatedAt: at,
              metaUpdatedAt: at,
            },
          },
        },
      });

      const delegate = new PrismaPagesRepository({ websiteId, client: prisma });
      const writer = new PrismaPagesRepository({ websiteId, client: prisma });
      let injected = false;
      let attemptedFirstCandidate:
        | CompareAndSetDraftPageBlocksInput
        | undefined;
      const decorated = repositoryWithCas(delegate, async (input) => {
        if (!injected) {
          injected = true;
          attemptedFirstCandidate = input;
          const concurrent = await writer.readByIdWithRevisions(
            "draft",
            pageId,
          );
          assert.ok(concurrent);
          assert.equal(
            await writer.compareAndSetDraftPageBlocks({
              pageId,
              expectedBlocksRevision: concurrent.revisions.blocksRevision,
              blocks: concurrent.page.blocks.map((block) =>
                block.id === "a"
                  ? { ...block, name: "Concurrent" }
                  : block,
              ),
              metaUpdatedAt: "2026-07-30T10:30:00.000Z",
            }),
            true,
          );
        }
        return delegate.compareAndSetDraftPageBlocks(input);
      });

      const result = await updateSectionBlock({ pages: decorated })({
        pageId,
        blockId: "a",
        expectedBlocksRevision: 0,
        baselineLcpPriorityBlockId: null,
        changes: {
          containerMode: {
            baseline: "contained",
            local: "fullBleed",
          },
        },
      });
      assert.equal(attemptedFirstCandidate?.expectedBlocksRevision, 0);
      assert.equal(result.outcome, "updated");
      assert.equal(result.blocksRevision, 2);

      const row = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId,
          },
        },
      });
      const persisted = (row.blocks as [typeof initial])[0]!;
      assert.equal(row.blocksRevision, 2);
      assert.equal(persisted.name, "Concurrent");
      assert.equal(persisted.containerMode, "fullBleed");
    } finally {
      await prisma.website.deleteMany({ where: { id: websiteId } });
      await prisma.$disconnect();
    }
  },
);

void test(
  "a rejected real PostgreSQL mutation leaves blocks, metadata, structure, and revisions unchanged",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteId = `occ-blocks-rollback-${suffix}`;
    const pageId = `page-${suffix}`;
    const parentPageId = `parent-${suffix}`;
    const at = new Date("2026-07-30T10:00:00.000Z");
    const currentBlock = {
      id: "a",
      type: "section" as const,
      name: "Remote",
      containerMode: "contained" as const,
      lcpPriority: false,
      rows: [],
    };

    try {
      await prisma.website.create({
        data: {
          id: websiteId,
          slug: websiteId,
          name: websiteId,
          type: "site",
          draftStructureRevision: 29,
          pages: {
            create: [
              {
                state: "draft",
                pageId: parentPageId,
                position: 0,
                parentPageId: null,
                slug: "parent",
                name: "Parent",
                seoTitle: null,
                seoDescription: null,
                blocks: [],
                paginationEnabled: false,
                metaRevision: 1,
                blocksRevision: 0,
                metaCreatedAt: at,
                metaUpdatedAt: at,
              },
              {
                state: "draft",
                pageId,
                position: 7,
                parentPageId,
                slug: "rollback-slug",
                name: "Rollback metadata",
                seoTitle: "Rollback SEO",
                seoDescription: "Rollback description",
                blocks: [currentBlock],
                paginationEnabled: true,
                metaRevision: 31,
                blocksRevision: 1,
                metaCreatedAt: at,
                metaUpdatedAt: at,
              },
            ],
          },
        },
      });
      const key = {
        websiteId_state_pageId: {
          websiteId,
          state: "draft" as const,
          pageId,
        },
      };
      const beforePage = await prisma.page.findUniqueOrThrow({ where: key });
      const beforeWebsite = await prisma.website.findUniqueOrThrow({
        where: { id: websiteId },
      });

      await assert.rejects(
        updateSectionBlock({
          pages: new PrismaPagesRepository({ websiteId, client: prisma }),
        })({
          pageId,
          blockId: "a",
          expectedBlocksRevision: 0,
          baselineLcpPriorityBlockId: null,
          changes: {
            name: { baseline: "A", local: "Rejected local" },
          },
        }),
      );

      const afterPage = await prisma.page.findUniqueOrThrow({ where: key });
      const afterWebsite = await prisma.website.findUniqueOrThrow({
        where: { id: websiteId },
      });
      assert.deepEqual(afterPage.blocks, beforePage.blocks);
      assert.equal(afterPage.blocksRevision, beforePage.blocksRevision);
      assert.equal(afterPage.name, beforePage.name);
      assert.equal(afterPage.slug, beforePage.slug);
      assert.equal(afterPage.seoTitle, beforePage.seoTitle);
      assert.equal(afterPage.seoDescription, beforePage.seoDescription);
      assert.equal(
        afterPage.paginationEnabled,
        beforePage.paginationEnabled,
      );
      assert.equal(afterPage.parentPageId, beforePage.parentPageId);
      assert.equal(afterPage.position, beforePage.position);
      assert.equal(afterPage.metaRevision, beforePage.metaRevision);
      assert.equal(
        afterWebsite.draftStructureRevision,
        beforeWebsite.draftStructureRevision,
      );
    } finally {
      await prisma.website.deleteMany({ where: { id: websiteId } });
      await prisma.$disconnect();
    }
  },
);
