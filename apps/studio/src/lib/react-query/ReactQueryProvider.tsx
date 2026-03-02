"use client";

/**
 * @file apps/studio/src/lib/react-query/ReactQueryProvider.tsx
 * @layer admin/lib/react-query
 *
 * @description
 * Provider React Query pour l’admin.
 * - Fournit le QueryClientProvider
 * - Active les Devtools uniquement en développement
 */

import { queryClient } from "@compoz/studio/lib/react-query/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

type ReactQueryProviderProps = {
  children: ReactNode;
};

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
