"use client";

/**
 * @file apps/studio/src/features/preview/PreviewProviders.tsx
 * @layer studio/features/preview
 *
 * @description
 * Runtime providers shared by Studio preview iframe pages.
 *
 * @remarks
 * - Applies theme overrides from the preview `theme` scope with a server-loaded fallback.
 * - Resolves the public UI skin from Website.slug.
 */

import type { ReactNode } from "react";

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { SiteRuntimeProvider } from "@compoz/ui/site/providers/SiteRuntimeProvider";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

type PreviewProvidersProps = Readonly<{
  children: ReactNode;
  websiteSlug: string;
  initialTheme?: ThemeSettingsShape | null;
}>;

export function PreviewProviders({
  children,
  websiteSlug,
  initialTheme = null,
}: PreviewProvidersProps) {
  const ui = resolveSiteUi(websiteSlug);

  const theme = usePreviewOverride<ThemeSettingsShape>("theme");
  const visibleTheme = theme.override ?? theme.baseline ?? initialTheme ?? null;

  return (
    <SiteRuntimeProvider ui={ui} theme={visibleTheme}>
      {children}
    </SiteRuntimeProvider>
  );
}

PreviewProviders.displayName = "PreviewProviders";
