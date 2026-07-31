/**
 * @file apps/studio/src/features/pages/blocks/hooks/invalidate-block-mutation-status-views.test.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Tests outcome-aware React Query invalidation for block mutations.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";

import { invalidateBlockMutationStatusViews } from "@compoz/studio/features/pages/blocks/hooks/invalidate-block-mutation-status-views";

void test("block status views invalidate after updated but not noChanges", async () => {
  const queryClient = new QueryClient();
  let calls = 0;
  queryClient.invalidateQueries = async () => {
    calls += 1;
  };

  await invalidateBlockMutationStatusViews({
    queryClient,
    websiteId: "website-a",
    pageId: "page-a",
    outcome: "noChanges",
  });
  assert.equal(calls, 0);

  await invalidateBlockMutationStatusViews({
    queryClient,
    websiteId: "website-a",
    pageId: "page-a",
    outcome: "updated",
  });
  assert.equal(calls, 5);
});
