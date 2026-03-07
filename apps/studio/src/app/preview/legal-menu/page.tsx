"use client";

/**
 * @file apps/studio/src/app/preview/legal-menu/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview (iframe) pour le menu légal du site.
 *
 * @remarks
 * - Lit les données via `usePreviewOverride` pour baseline et override.
 * - Rend uniquement si baseline ou override est disponible (empty géré par le wrapper preview).
 * - Strictement UI-only, version minimaliste (V0.5).
 */

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

import { SiteLegalMenu } from "@compoz/ui/site/components/molecules/SiteLegalMenu";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function LegalMenuPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<LegalMenuSettingsShape>("legalMenu");

  const visible = override ?? baseline;

  // Empty state géré par le wrapper preview
  if (!visible) return null;

  const ui = resolveSiteUi();

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <SiteLegalMenu legalMenu={visible} ui={ui.footer.legalMenu} />
    </div>
  );
}

LegalMenuPreviewPage.displayName = "LegalMenuPreviewPage";
