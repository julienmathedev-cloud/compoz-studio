"use client";
/**
 * @file packages/ui/src/site/providers/SiteUiProvider.tsx
 * @layer ui/site/providers
 *
 * @description
 * Provider pour le UI du site.
 */

import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type SiteUiContextValue = Readonly<{
  ui: SiteGlobalUi;
}>;

const SiteUiContext = createContext<SiteUiContextValue | null>(null);

export type SiteUiProviderProps = Readonly<{
  ui: SiteGlobalUi;
  children: ReactNode;
}>;

export function SiteUiProvider({ ui, children }: SiteUiProviderProps) {
  return (
    <SiteUiContext.Provider value={{ ui }}>{children}</SiteUiContext.Provider>
  );
}

SiteUiProvider.displayName = "SiteUiProvider";

export function useSiteUi(): SiteGlobalUi {
  const ctx = useContext(SiteUiContext);
  if (!ctx) {
    throw new Error("useSiteUi must be used within <SiteUiProvider />");
  }
  return ctx.ui;
}
