/**
 * @file packages/ui/src/site/providers/PublicUiProvider.tsx
 * @layer ui/public/providers
 *
 * @description
 * Provider pour le UI public.
 */
"use client";

import type { PublicGlobalUi } from "@compoz/ui/site/public-ui.types";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type PublicUiContextValue = Readonly<{
  ui: PublicGlobalUi;
}>;

const PublicUiContext = createContext<PublicUiContextValue | null>(null);

export type PublicUiProviderProps = Readonly<{
  ui: PublicGlobalUi;
  children: ReactNode;
}>;

export function PublicUiProvider({ ui, children }: PublicUiProviderProps) {
  return (
    <PublicUiContext.Provider value={{ ui }}>
      {children}
    </PublicUiContext.Provider>
  );
}

PublicUiProvider.displayName = "PublicUiProvider";

export function usePublicUi(): PublicGlobalUi {
  const ctx = useContext(PublicUiContext);
  if (!ctx)
    throw new Error("usePublicUi must be used within <PublicUiProvider />");
  return ctx.ui;
}
