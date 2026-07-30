/**
 * @file apps/studio/src/features/pages/hooks/draft-structure-mutation.test.ts
 * @layer studio/features/pages/hooks
 * @description Tests client adoption of server structure conflict snapshots.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import {
  adoptDraftStructureConflict,
  adoptDraftStructureConflictDetails,
  draftStructureMutationOptions,
  requireDraftStructureSnapshot,
} from "@compoz/studio/features/pages/hooks/draft-structure-mutation";
import { toUpdatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import { setDraftStructureCache } from "@compoz/studio/features/site-index/cache";

const SERVER = {
  index: {
    pages: [
      {
        id: "server",
        slug: "server",
        name: "Server",
        parentId: null,
        metaRevision: 1,
      },
    ],
    updatedAt: "2026-07-29T11:00:00.000Z",
  },
  draftStructureRevision: 8,
};

void test("conflict replaces the whole optimistic snapshot without merging", () => {
  const queryClient = new QueryClient();
  setDraftStructureCache(queryClient, "website-a", undefined, {
    index: {
      pages: [
        {
          id: "local",
          slug: "local",
          name: "Local",
          parentId: null,
          metaRevision: 1,
        },
      ],
      updatedAt: "2026-07-29T10:00:00.000Z",
    },
    draftStructureRevision: 7,
  });
  const error = new HttpError(
    ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
    {
      status: 409,
      code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
      body: {
        error: {
          code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
          details: {
            expectedDraftStructureRevision: 7,
            currentDraftStructureRevision: 8,
            current: SERVER,
          },
        },
      },
    },
  );

  assert.equal(
    adoptDraftStructureConflict(queryClient, "website-a", error),
    true,
  );
  assert.deepEqual(
    requireDraftStructureSnapshot(queryClient, "website-a"),
    SERVER,
  );
});

void test("older conflicts are ignored while a newer server conflict is adopted", () => {
  const queryClient = new QueryClient();
  setDraftStructureCache(queryClient, "website-a", undefined, {
    ...SERVER,
    draftStructureRevision: 6,
  });
  const older = new HttpError(ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT, {
    status: 409,
    code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
    body: {
      error: {
        code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
        details: {
          expectedDraftStructureRevision: 4,
          currentDraftStructureRevision: 5,
          current: { ...SERVER, draftStructureRevision: 5 },
        },
      },
    },
  });
  assert.equal(adoptDraftStructureConflict(queryClient, "website-a", older), true);
  assert.equal(
    requireDraftStructureSnapshot(queryClient, "website-a")
      .draftStructureRevision,
    6,
  );
});

void test("a new parent action uses the adopted structure revision", () => {
  const queryClient = new QueryClient();
  adoptDraftStructureConflictDetails(
    queryClient,
    "website-a",
    {
      expectedDraftStructureRevision: 7,
      currentDraftStructureRevision: 8,
      current: SERVER,
    },
  );
  const baseline = {
    name: "Local metadata",
    slug: "local-metadata",
    seoTitle: null,
    seoDescription: null,
    parentId: null,
    sitemap: null,
    paginationEnabled: false,
  };
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline,
    local: { ...baseline, parentId: "parent-c" },
    expectedMetaRevision: 4,
    expectedDraftStructureRevision:
      requireDraftStructureSnapshot(
        queryClient,
        "website-a",
      ).draftStructureRevision,
  });

  assert.deepEqual(payload.metadataChanges, undefined);
  assert.deepEqual(payload.parentChange, {
    baseline: null,
    local: "parent-c",
    expectedDraftStructureRevision: 8,
  });
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

void test("TanStack executes Website mutations serially in trigger order", async () => {
  const queryClient = new QueryClient();
  const firstGate = deferred();
  const firstStarted = deferred();
  const secondStarted = deferred();
  const applied: string[] = [];
  const cache = queryClient.getMutationCache();
  const first = cache.build(queryClient, {
    ...draftStructureMutationOptions("website-a"),
    mutationFn: async () => {
      firstStarted.resolve();
      await firstGate.promise;
      return "first";
    },
    onSuccess: (value) => {
      applied.push(value);
    },
  });
  const second = cache.build(queryClient, {
    ...draftStructureMutationOptions("website-a"),
    mutationFn: async () => {
      secondStarted.resolve();
      return "second";
    },
    onSuccess: (value) => {
      applied.push(value);
    },
  });

  const firstResult = first.execute(undefined);
  await firstStarted.promise;
  const secondResult = second.execute(undefined);
  await Promise.resolve();
  assert.equal(second.state.isPaused, true);

  firstGate.resolve();
  await firstResult;
  await secondStarted.promise;
  await secondResult;
  assert.deepEqual(applied, ["first", "second"]);
});

void test(
  "TanStack lets mutations from distinct Websites start in parallel",
  { timeout: 1_000 },
  async () => {
    const queryClient = new QueryClient();
    const gate = deferred();
    const firstStarted = deferred();
    const secondStarted = deferred();
    const cache = queryClient.getMutationCache();
    const first = cache.build(queryClient, {
      ...draftStructureMutationOptions("website-a"),
      mutationFn: async () => {
        firstStarted.resolve();
        await gate.promise;
      },
    });
    const second = cache.build(queryClient, {
      ...draftStructureMutationOptions("website-b"),
      mutationFn: async () => {
        secondStarted.resolve();
        await gate.promise;
      },
    });

    const firstResult = first.execute(undefined);
    const secondResult = second.execute(undefined);
    await Promise.all([firstStarted.promise, secondStarted.promise]);
    assert.equal(first.state.isPaused, false);
    assert.equal(second.state.isPaused, false);

    gate.resolve();
    await Promise.all([firstResult, secondResult]);
  },
);
