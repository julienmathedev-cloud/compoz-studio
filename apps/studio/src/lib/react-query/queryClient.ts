/**
 * @file apps/studio/src/lib/react-query/queryClient.ts
 * @layer studio/lib/react-query
 *
 * @description
 * Singleton TanStack Query client for the Studio app.
 *
 * @remarks
 * - Configured for editor UX: no aggressive refetching, limited retries, and controlled cache lifetime.
 * - Imported by the client-side `QueryClientProvider` so the Studio shares one bundle-level instance.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});
