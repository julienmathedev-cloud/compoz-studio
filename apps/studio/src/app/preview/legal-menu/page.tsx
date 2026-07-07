"use client";

/**
 * @file apps/studio/src/app/preview/legal-menu/page.tsx
 * @layer studio/app
 *
 * @description
 * Iframe preview page for the site legal menu.
 *
 * @remarks
 * - Reads baseline and override data through `usePreviewOverride`.
 * - Renders only when a baseline or override is available; the empty state is handled by the preview wrapper.
 * - The UI skin is provided by `SiteUiProvider` mounted in `PreviewProviders`.
 * - The CSS theme is provided by `ThemeProvider` mounted in `PreviewProviders`.
 */

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

import { SiteLegalMenu } from "@compoz/ui/site/components/molecules/SiteLegalMenu";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

export default function LegalMenuPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<LegalMenuSettingsShape>("legalMenu");

  const visible = override ?? baseline;
  const ui = useSiteUi();

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <SiteLegalMenu legalMenu={visible} ui={ui.footer.legalMenu} />
    </div>
  );
}

LegalMenuPreviewPage.displayName = "LegalMenuPreviewPage";
