"use client";

/**
 * @file apps/studio/src/app/preview/primary-menu/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview pour le menu principal site.
 */

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

import { SitePrimaryMenu } from "@compoz/ui/site/components/organisms/SitePrimaryMenu";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function PrimaryMenuPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<PrimaryMenuSettingsShape>("primaryMenu");

  const visible = override ?? baseline;
  if (!visible) return null;

  const ui = resolveSiteUi();

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <SitePrimaryMenu settings={visible} ui={ui.header.menu} />
    </div>
  );
}

PrimaryMenuPreviewPage.displayName = "PrimaryMenuPreviewPage";
