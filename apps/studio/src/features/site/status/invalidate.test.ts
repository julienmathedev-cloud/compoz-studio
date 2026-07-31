/**
 * @file apps/studio/src/features/site/status/invalidate.test.ts
 * @layer studio/features/site/status
 * @description Tests Website-scoped status cache invalidation helpers.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import {
  invalidateAllSiteStatusViews,
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
import {
  siteStatusDetailsKey,
  siteStatusDetailsPrefix,
  siteStatusKey,
} from "@compoz/studio/features/site/status/keys";

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

void test("invalidates exactly the global Website status key", async () => {
  const queryClient = createQueryClient();
  const calls: unknown[] = [];
  queryClient.invalidateQueries = async (filters) => { calls.push(filters); };

  await invalidateSiteStatus(queryClient, "website-a");

  assert.deepEqual(calls, [{ queryKey: siteStatusKey("website-a") }]);
});

void test("invalidates status details by Website-scoped prefix", async () => {
  const queryClient = createQueryClient();
  const calls: unknown[] = [];
  queryClient.invalidateQueries = async (filters) => { calls.push(filters); };

  await invalidateSiteStatusDetails(queryClient, "website-a");

  assert.deepEqual(calls, [{ queryKey: siteStatusDetailsPrefix("website-a") }]);
  assert.notDeepEqual(
    siteStatusDetailsPrefix("website-a"),
    siteStatusDetailsKey({ websiteId: "website-a", scope: "dirty", includeBlocks: true }),
  );
});

void test("invalidates all status views only for the requested Website", async () => {
  const queryClient = createQueryClient();
  const calls: unknown[] = [];
  queryClient.invalidateQueries = async (filters) => { calls.push(filters); };

  await invalidateAllSiteStatusViews(queryClient, "website-a");

  assert.deepEqual(calls, [
    { queryKey: siteStatusKey("website-a") },
    { queryKey: siteStatusDetailsPrefix("website-a") },
  ]);
});
