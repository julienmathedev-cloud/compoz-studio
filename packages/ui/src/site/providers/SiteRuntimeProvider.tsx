"use client";

/**
 * @file packages/ui/src/site/providers/SiteRuntimeProvider.tsx
 * @layer ui/site/providers
 *
 * @description
 * Provider racine du runtime UI du site public.
 *
 * @remarks
 * - Compose les providers transverses nécessaires au rendu du site.
 * - `theme` reste une donnée de settings injectée depuis le server.
 * - `ui` représente le design system résolu côté server.
 * - La stabilisation des valeurs de contexte est déléguée
 *   aux providers spécialisés (`ThemeProvider`, `SiteUiProvider`).
 */

import type { ReactNode } from "react";

import { ThemeProvider } from "@compoz/ui/settings/theme/ThemeProvider";
import { SiteUiProvider } from "@compoz/ui/site/providers/SiteUiProvider";
import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

export type SiteRuntimeProviderProps = Readonly<{
  /** UI globale résolue côté server pour le site public. */
  ui: SiteGlobalUi;

  /** Settings de thème publiés du site. */
  theme: ThemeSettingsShape | null | undefined;

  /** Arbre React à envelopper. */
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
