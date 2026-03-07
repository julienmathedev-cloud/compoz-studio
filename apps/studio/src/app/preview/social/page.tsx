"use client";

/**
 * @file apps/studio/src/app/preview/social/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview pour le menu social site.
 */

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

import { SiteSocialMenu } from "@compoz/ui/site/components/molecules/SiteSocialMenu";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function SocialPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<SocialSettingsShape>("social");

  const visible = override ?? baseline;
  if (!visible) return null;

  const ui = resolveSiteUi();

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <SiteSocialMenu settings={visible} ui={ui.header.social} />
    </div>
  );
}

SocialPreviewPage.displayName = "SocialPreviewPage";
