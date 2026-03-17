"use client";

/**
 * @file apps/studio/src/app/preview/social/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview pour le menu social site.
 *
 * @remarks
 * - Lit les données via `usePreviewOverride` pour baseline et override.
 * - Rend uniquement si baseline ou override est disponible.
 * - Le skin UI est fourni par `SiteUiProvider` monté dans `PreviewProviders`.
 * - Le thème CSS est fourni par `ThemeProvider` monté dans `PreviewProviders`.
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
