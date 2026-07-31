/**
 * @file apps/studio/src/features/pages/hooks/invalidate-page-mutation-status-views.test.ts
 * @layer studio/features/pages/hooks
 * @description Tests outcome-aware React Query invalidation for page mutations.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { invalidatePageMutationStatusViews } from "@compoz/studio/features/pages/hooks/invalidate-page-mutation-status-views";
import {
  siteStatusDetailsPrefix,
  siteStatusKey,
} from "@compoz/studio/features/site/status/keys";

void test("page status views invalidate after updated but not noChanges", async () => {
  const queryClient = new QueryClient();
  const calls: unknown[] = [];
  queryClient.invalidateQueries = async (filters) => { calls.push(filters); };

  await invalidatePageMutationStatusViews({
    queryClient,
    websiteId: "website-a",
    outcome: "noChanges",
  });
  assert.equal(calls.length, 0);

  await invalidatePageMutationStatusViews({
    queryClient,
    websiteId: "website-a",
    outcome: "updated",
  });
  assert.deepEqual(calls, [
    { queryKey: siteStatusKey("website-a") },
    { queryKey: siteStatusDetailsPrefix("website-a") },
  ]);
});
