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
  draftStructureMutationOptions,
  refreshMenuSettingsAfterConflict,
  requireDraftStructureSnapshot,
  resolveMenuRenameExpectedRevisions,
} from "@compoz/studio/features/pages/hooks/draft-structure-mutation";
import { setDraftStructureCache } from "@compoz/studio/features/site-index/cache";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

const SERVER = {
  index: {
    pages: [
      { id: "server", slug: "server", name: "Server", parentId: null },
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
        { id: "local", slug: "local", name: "Local", parentId: null },
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

function settingsConflict(resourceId: "primaryMenu" | "legalMenu") {
  return new HttpError(
    ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
    {
      status: 409,
      code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
      body: {
        error: {
          code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
          details: {
            resourceId,
            expectedRevision: 1,
            currentRevision: 2,
            conflictingPaths: ["items"],
          },
        },
      },
    },
  );
}

function settingsBundle(revision: number) {
  return {
    settings: {
      header: {},
      footer: {},
      primaryMenu: {},
      legalMenu: {},
      social: {},
      identity: {},
      seo: {},
      theme: {},
    },
    revisions: {
      headerRevision: 0,
      footerRevision: 0,
      primaryMenuRevision: revision,
      legalMenuRevision: revision + 1,
      socialRevision: 0,
      identityRevision: 0,
      seoRevision: 0,
      themeRevision: 0,
    },
  };
}

for (const resourceId of ["primaryMenu", "legalMenu"] as const) {
  void test(`${resourceId} conflict invalidates and refetches the settings bundle`, async () => {
    const queryClient = new QueryClient();
    const key = settingsBundleKey("website-a", "draft");
    setDraftStructureCache(queryClient, "website-a", undefined, SERVER);
    const structureBefore = requireDraftStructureSnapshot(
      queryClient,
      "website-a",
    );
    let revision = 1;
    let reads = 0;
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async () => ({ revision: ++reads === 1 ? revision : 2 }),
    });
    revision = 2;

    assert.equal(
      await refreshMenuSettingsAfterConflict(
        queryClient,
        "website-a",
        settingsConflict(resourceId),
      ),
      true,
    );
    assert.equal(reads, 2);
    assert.deepEqual(queryClient.getQueryData(key), { revision: 2 });
    assert.strictEqual(
      requireDraftStructureSnapshot(queryClient, "website-a"),
      structureBefore,
    );
  });
}

void test("structure and technical errors do not trigger settings refresh", async () => {
  const queryClient = new QueryClient();
  const structural = new HttpError(
    ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
    {
      status: 409,
      code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
    },
  );

  assert.equal(
    await refreshMenuSettingsAfterConflict(
      queryClient,
      "website-a",
      structural,
    ),
    false,
  );
  assert.equal(
    await refreshMenuSettingsAfterConflict(
      queryClient,
      "website-a",
      new Error("network"),
    ),
    false,
  );
});

void test("the next scoped attempt starts after conflict refetch and sees its new revision", async () => {
  const queryClient = new QueryClient();
  const key = settingsBundleKey("website-a", "draft");
  let serverRevision = 1;
  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => settingsBundle(serverRevision),
  });
  serverRevision = 2;

  const cache = queryClient.getMutationCache();
  const first = cache.build(queryClient, {
    ...draftStructureMutationOptions("website-a"),
    mutationFn: async () => {
      throw settingsConflict("primaryMenu");
    },
    onError: async (error) => {
      await refreshMenuSettingsAfterConflict(
        queryClient,
        "website-a",
        error,
      );
    },
    retry: false,
  });
  let revisionsSeenByRetry:
    | Awaited<ReturnType<typeof resolveMenuRenameExpectedRevisions>>
    | undefined;
  const second = cache.build(queryClient, {
    ...draftStructureMutationOptions("website-a"),
    mutationFn: async () => {
      revisionsSeenByRetry =
        await resolveMenuRenameExpectedRevisions(
          queryClient,
          "website-a",
        );
    },
  });

  const firstResult = first.execute(undefined).catch(() => undefined);
  const secondResult = second.execute(undefined);
  await Promise.all([firstResult, secondResult]);
  assert.deepEqual(revisionsSeenByRetry, {
    expectedPrimaryMenuRevision: 2,
    expectedLegalMenuRevision: 3,
  });
});
