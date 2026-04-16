"use client";

/**
 * @file apps/studio/src/features/preview/PreviewProviders.tsx
 * @layer ui/studio/preview
 *
 * @description
 * Providers globaux utilisés dans la preview iframe.
 *
 * @remarks
 * - Injecte le thème CSS du site via le scope preview `theme`.
 * - Utilise un fallback global `initialTheme` chargé côté serveur.
 * - Injecte le skin UI public résolu pour le tenant courant.
 * - Évite la répétition dans chaque preview page.
 */

import type { ReactNode } from "react";

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { SiteRuntimeProvider } from "@compoz/ui/site/providers/SiteRuntimeProvider";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

type PreviewProvidersProps = Readonly<{
  children: ReactNode;
  tenantId: string;
  initialTheme?: ThemeSettingsShape | null;
}>;

export function PreviewProviders({
  children,
  tenantId,
  initialTheme = null,
}: PreviewProvidersProps) {
  const ui = resolveSiteUi(tenantId);

  const theme = usePreviewOverride<ThemeSettingsShape>("theme");
  const visibleTheme = theme.override ?? theme.baseline ?? initialTheme ?? null;

  return (
    <SiteRuntimeProvider ui={ui} theme={visibleTheme}>
      {children}
    </SiteRuntimeProvider>
  );
}

PreviewProviders.displayName = "PreviewProviders";
