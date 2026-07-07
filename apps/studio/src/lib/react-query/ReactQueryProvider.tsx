"use client";

/**
 * @file apps/studio/src/lib/react-query/ReactQueryProvider.tsx
 * @layer studio/lib/react-query
 *
 * @description
 * React Query provider for the Studio app.
 *
 * @remarks
 * - Provides the shared Studio `QueryClientProvider` instance.
 * - Loads React Query Devtools dynamically in development to keep the production bundle lean.
 */

import { queryClient } from "@compoz/studio/lib/react-query/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools),
  { ssr: false },
);

type ReactQueryProviderProps = {
  children: ReactNode;
};

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDev ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
