/**
 * @file apps/studio/src/features/pages/blocks/hooks/invalidate-block-mutation-status-views.test.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Tests outcome-aware React Query invalidation for block mutations.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";

import { invalidateBlockMutationStatusViews } from "@compoz/studio/features/pages/blocks/hooks/invalidate-block-mutation-status-views";
import {
  siteStatusDetailsPrefix,
  siteStatusKey,
} from "@compoz/studio/features/site/status/keys";

void test("block status views invalidate after updated but not noChanges", async () => {
  const queryClient = new QueryClient();
  const calls: unknown[] = [];
  queryClient.invalidateQueries = async (filters) => { calls.push(filters); };

  await invalidateBlockMutationStatusViews({
    queryClient,
    websiteId: "website-a",
    outcome: "noChanges",
  });
  assert.equal(calls.length, 0);

  await invalidateBlockMutationStatusViews({
    queryClient,
    websiteId: "website-a",
    outcome: "updated",
  });
  assert.deepEqual(calls, [
    { queryKey: siteStatusKey("website-a") },
    { queryKey: siteStatusDetailsPrefix("website-a") },
  ]);
});
