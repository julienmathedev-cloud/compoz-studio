"use client";

/**
 * @file apps/studio/src/app/preview/primary-menu/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview pour le menu principal site.
 *
 * @remarks
 * - Lit les données via `usePreviewOverride` pour baseline et override.
 * - Rend uniquement si baseline ou override est disponible.
 * - Le skin UI est fourni par `SiteUiProvider` monté dans `PreviewProviders`.
 * - Le thème CSS est fourni par `ThemeProvider` monté dans `PreviewProviders`.
 */

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

import { SitePrimaryMenu } from "@compoz/ui/site/components/organisms/SitePrimaryMenu";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

export default function PrimaryMenuPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<PrimaryMenuSettingsShape>("primaryMenu");

  const visible = override ?? baseline;
  const ui = useSiteUi();

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <SitePrimaryMenu settings={visible} ui={ui.header.menu} />
    </div>
  );
}

PrimaryMenuPreviewPage.displayName = "PrimaryMenuPreviewPage";
