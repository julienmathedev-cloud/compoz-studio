"use client";

/**
 * @file apps/studio/src/app/preview/social/page.tsx
 * @layer studio/app
 *
 * @description
 * Preview page for the site social menu.
 *
 * @remarks
 * - Reads baseline and override data through `usePreviewOverride`.
 * - Renders only when a baseline or override is available.
 * - The UI skin is provided by `SiteUiProvider` mounted in `PreviewProviders`.
 * - The CSS theme is provided by `ThemeProvider` mounted in `PreviewProviders`.
 */

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

import { SiteSocialMenu } from "@compoz/ui/site/components/molecules/SiteSocialMenu";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

export default function SocialPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<SocialSettingsShape>("social");

  const visible = override ?? baseline;
  const ui = useSiteUi();

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <SiteSocialMenu settings={visible} ui={ui.header.social} />
    </div>
  );
}

SocialPreviewPage.displayName = "SocialPreviewPage";
