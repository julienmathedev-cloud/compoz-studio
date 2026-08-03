/**
 * @file apps/studio/src/features/pages/blocks/hooks/block-reorder-conflict.test.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Regression tests for adopting, rather than resolving, reorder conflicts.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { adoptPageBlocksReorderConflict } from "@compoz/studio/features/pages/blocks/hooks/block-reorder-conflict";

const block = (id: string, name: string) => ({
  id,
  type: "section" as const,
  name,
  containerMode: "contained" as const,
  lcpPriority: false,
  rows: [],
});

function conflict(current: PageBlocksSnapshotDTO, operation = "reorder") {
  return new HttpError(ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT, {
    status: 409,
    body: {
      error: {
        code: ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
        details: {
          resourceId: "page-a",
          expectedBlocksRevision: 4,
          currentBlocksRevision: current.blocksRevision,
          operation,
          conflictKind: "functional",
          conflictingPaths: ["blocks"],
          conflicts: [{
            kind: "orderIncompatible",
            path: "blocks",
            baselineOrder: ["a", "b", "c"],
            currentOrder: current.blocks.map((item) => item.id),
            localOrder: ["b", "c", "a"],
            addedBlockIds: [],
            removedBlockIds: [],
          }],
          current,
        },
      },
    },
  });
}

void test("a reorder conflict authoritatively replaces the optimistic order and revision", () => {
  const queryClient = new QueryClient();
  const key = pageBlocksKey("website-a", "page-a", "draft");
  const optimistic: PageBlocksSnapshotDTO = {
    blocks: [block("b", "B local"), block("c", "C local"), block("a", "A local")],
    blocksRevision: 4,
  };
  const server: PageBlocksSnapshotDTO = {
    blocks: [block("c", "C server"), block("a", "A server"), block("b", "B server")],
    blocksRevision: 5,
  };
  queryClient.setQueryData(key, optimistic);

  const adopted = adoptPageBlocksReorderConflict({
    queryClient,
    websiteId: "website-a",
    pageId: "page-a",
    error: conflict(server),
  });

  assert.ok(adopted);
  assert.equal(adopted.operation, "reorder");
  assert.deepEqual(
    queryClient.getQueryData<PageBlocksSnapshotDTO>(key),
    server,
  );
  assert.deepEqual(server.blocks.map((item) => item.id), ["c", "a", "b"]);
  assert.deepEqual(new Set(server.blocks.map((item) => item.id)), new Set(["a", "b", "c"]));
  assert.deepEqual(server.blocks.map((item) => item.name), ["C server", "A server", "B server"]);
});

void test("only reorder conflicts enter the immediate-adoption branch", () => {
  const queryClient = new QueryClient();
  const key = pageBlocksKey("website-a", "page-a", "draft");
  const local: PageBlocksSnapshotDTO = {
    blocks: [block("a", "Local")],
    blocksRevision: 4,
  };
  queryClient.setQueryData(key, local);

  assert.equal(
    adoptPageBlocksReorderConflict({
      queryClient,
      websiteId: "website-a",
      pageId: "page-a",
      error: conflict({ blocks: [block("a", "Remote")], blocksRevision: 5 }, "update"),
    }),
    null,
  );
  assert.deepEqual(queryClient.getQueryData(key), local);
});

void test("the reorder hook has one attempt, no interactive state, and one conflict toast", () => {
  const hookSource = readFileSync(new URL("./useReorderBlocks.ts", import.meta.url), "utf8");
  const sectionSource = readFileSync(
    new URL("../../sections/PageBlocksListSection.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(hookSource.match(/pagesStudioApi\.reorderBlocks/gu)?.length, 1);
  assert.match(hookSource, /retry: false/u);
  assert.match(hookSource, /adoptPageBlocksReorderConflict/u);
  assert.equal(hookSource.match(/notify\.error\(/gu)?.length, 1);
  assert.doesNotMatch(hookSource, /notify\.success\(/u);
  assert.match(hookSource, /pendingReorderRef\.current/u);
  assert.match(hookSource, /if \(running\)/u);
  assert.doesNotMatch(hookSource, /useState|setConflict|clearConflict/u);
  assert.doesNotMatch(sectionSource, /reorderConflict|clearReorderConflict/u);
  assert.doesNotMatch(sectionSource, /blockConflict\.operation === "reorder"/u);
  assert.match(sectionSource, /if \(fromIndex === toIndex\) return/u);
  assert.match(sectionSource, /expectedBlocksRevision: blocksRevision/u);
  assert.match(sectionSource, /finally \{\s*setBusyId\(null\)/u);

  const fr = JSON.parse(readFileSync(new URL("../../../../i18n/messages/fr.json", import.meta.url), "utf8")) as { studio: { pageBlocksConflict: { reorderConflict: { title: string; description: string } } } };
  const en = JSON.parse(readFileSync(new URL("../../../../i18n/messages/en.json", import.meta.url), "utf8")) as typeof fr;
  assert.deepEqual(fr.studio.pageBlocksConflict.reorderConflict, {
    title: "L’ordre des blocs a été modifié",
    description: "Un autre déplacement a été enregistré avant le vôtre. L’ordre le plus récent a été chargé. Recommencez votre déplacement.",
  });
  assert.deepEqual(en.studio.pageBlocksConflict.reorderConflict, {
    title: "Block order was changed",
    description: "Another move was saved before yours. The latest order has been loaded. Repeat your move.",
  });
});
