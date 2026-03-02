"use client";

/**
 * @file apps/studio/src/app/preview/legal-menu/page.tsx
 * @layer app/preview
 *
 * @description
 * Page de preview pour le menu légal public.
 *
 * @remarks
 * - Lit les données via `usePreviewOverride` pour baseline et override.
 * - Rend le menu uniquement si baseline ou override est disponible.
 * - Strictement UI-only, version minimaliste (V0.5).
 */
import { PublicLegalMenu } from "@compoz/ui/site/components/molecules/PublicLegalMenu";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";

export default function LegalMenuPreviewPage() {
  const { baseline, override } =
    usePreviewOverride<LegalMenuSettingsShape>("legalMenu");

  const visible = override ?? baseline;

  // ✅ Empty preview au lieu de `return null`
  if (!visible) {
    return null;
  }

  const ui = resolvePublicUi();

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <PublicLegalMenu legalMenu={visible} ui={ui.footer.legalMenu} />
    </div>
  );
}

LegalMenuPreviewPage.displayName = "LegalMenuPreviewPage";
