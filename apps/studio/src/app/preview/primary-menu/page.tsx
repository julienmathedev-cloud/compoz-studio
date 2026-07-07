"use client";

/**
 * @file apps/studio/src/app/preview/primary-menu/page.tsx
 * @layer studio/app
 *
 * @description
 * Preview page for the site primary menu.
 *
 * @remarks
 * - Reads baseline and override data through `usePreviewOverride`.
 * - Renders only when a baseline or override is available.
 * - The UI skin is provided by `SiteUiProvider` mounted in `PreviewProviders`.
 * - The CSS theme is provided by `ThemeProvider` mounted in `PreviewProviders`.
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
