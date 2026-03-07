/**
 * @file apps/studio/src/lib/react-query/queryClient.ts
 * @layer studio/lib/react-query
 *
 * @description
 * Instance unique du QueryClient (TanStack Query) pour le Studio (admin).
 * Config orientée UX admin :
 * - pas de refetch agressif
 * - retries limités
 * - cache contrôlé
 *
 * @remarks
 * - À importer depuis un Provider client (ex: `QueryClientProvider`).
 * - Ce module expose une instance singleton au niveau du bundle.
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
