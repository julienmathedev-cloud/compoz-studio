"use client";

/**
 * @file apps/studio/src/app/preview/primary-menu/page.tsx
 * @layer app/preview
 *
 * @description
 * Page de preview pour le menu principal public.
 */

import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { PublicPrimaryMenu } from "@compoz/ui/site/components/organisms/PublicPrimaryMenu";

export default function PrimaryMenuPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<PrimaryMenuSettingsShape>("primaryMenu");

  const visible = override ?? baseline;

  // ✅ Empty preview au lieu de `return null`
  if (!visible) {
    return null;
  }

  const ui = resolvePublicUi();

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <PublicPrimaryMenu settings={visible} ui={ui.header.menu} />
    </div>
  );
}

PrimaryMenuPreviewPage.displayName = "PrimaryMenuPreviewPage";
