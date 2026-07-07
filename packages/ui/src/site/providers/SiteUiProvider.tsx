"use client";

/**
 * @file packages/ui/src/site/providers/SiteUiProvider.tsx
 * @layer ui/site/providers
 *
 * @description
 * Exposes the resolved public site UI through React context.
 *
 * @remarks
 * The UI object is resolved on the server; the provider value is memoized to avoid unnecessary consumer rerenders.
 */

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";

type SiteUiContextValue = Readonly<{
  ui: SiteGlobalUi;
}>;

const SiteUiContext = createContext<SiteUiContextValue | null>(null);

export type SiteUiProviderProps = Readonly<{
  ui: SiteGlobalUi;
  children: ReactNode;
}>;

export function SiteUiProvider({ ui, children }: SiteUiProviderProps) {
  const contextValue = useMemo<SiteUiContextValue>(() => ({ ui }), [ui]);

  return (
    <SiteUiContext.Provider value={contextValue}>
      {children}
    </SiteUiContext.Provider>
  );
}

SiteUiProvider.displayName = "SiteUiProvider";

export function useSiteUi(): SiteGlobalUi {
  const context = useContext(SiteUiContext);

  if (!context) {
    throw new Error("useSiteUi must be used within <SiteUiProvider />");
  }

  return context.ui;
}
