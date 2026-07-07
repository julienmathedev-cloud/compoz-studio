"use client";

/**
 * @file packages/ui/src/site/providers/SiteRuntimeProvider.tsx
 * @layer ui/site/providers
 *
 * @description
 * Composes the root public site runtime providers for theme and resolved site UI.
 *
 * @remarks
 * Theme settings and resolved UI are injected from the server; memoization remains delegated to the specialized providers.
 */

import type { ReactNode } from "react";

import { ThemeProvider } from "@compoz/ui/settings/theme/ThemeProvider";
import { SiteUiProvider } from "@compoz/ui/site/providers/SiteUiProvider";
import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

export type SiteRuntimeProviderProps = Readonly<{
  ui: SiteGlobalUi;
  theme: ThemeSettingsShape | null | undefined;
  children: ReactNode;
}>;

export function SiteRuntimeProvider({
  ui,
  theme,
  children,
}: SiteRuntimeProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <SiteUiProvider ui={ui}>{children}</SiteUiProvider>
    </ThemeProvider>
  );
}

SiteRuntimeProvider.displayName = "SiteRuntimeProvider";
