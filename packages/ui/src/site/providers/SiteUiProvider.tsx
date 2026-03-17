"use client";

/**
 * @file packages/ui/src/site/providers/SiteUiProvider.tsx
 * @layer ui/site/providers
 *
 * @description
 * Provider du design system global du site.
 *
 * @remarks
 * - Expose l'objet `ui` résolu côté server via un contexte React.
 * - La valeur du provider est stabilisée avec `useMemo`
 *   pour éviter les rerenders inutiles des consommateurs.
 */

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";

type SiteUiContextValue = Readonly<{
  /** Design system global du site. */
  ui: SiteGlobalUi;
}>;

const SiteUiContext = createContext<SiteUiContextValue | null>(null);

export type SiteUiProviderProps = Readonly<{
  /** Design system global résolu côté server. */
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
