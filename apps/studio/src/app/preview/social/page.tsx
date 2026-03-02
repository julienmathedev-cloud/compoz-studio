"use client";

/**
 * @file apps/studio/src/app/preview/social/page.tsx
 * @layer app/preview
 *
 * @description
 * Page de preview pour le menu social public.
 */

import { PublicSocialMenu } from "@compoz/ui/site/components/molecules/PublicSocialMenu";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";

export default function SocialPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<SocialSettingsShape>("social");

  const visible = override ?? baseline;

  // ✅ Empty preview au lieu de `return null`
  if (!visible) {
    return null;
  }

  const ui = resolvePublicUi();

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <PublicSocialMenu settings={visible} ui={ui.header.social} />
    </div>
  );
}

SocialPreviewPage.displayName = "SocialPreviewPage";
