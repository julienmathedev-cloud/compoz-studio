"use client";

/**
 * @file apps/studio/src/app/preview/footer/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview (iframe) pour le Footer du site.
 *
 * @remarks
 * - Lit les données via `usePreviewOverride` pour footer et legalMenu.
 * - Rend uniquement si les baselines nécessaires sont disponibles.
 * - Le skin UI est fourni par `SiteUiProvider` monté dans `PreviewProviders`.
 * - Le thème CSS est fourni par `ThemeProvider` monté dans `PreviewProviders`.
 */

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

import { SiteFooter } from "@compoz/ui/site/components/layouts/SiteFooter";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

export default function FooterPreviewPage() {
  const footer = usePreviewOverride<FooterSettingsShape>("footer");
  const legalMenu = usePreviewOverride<LegalMenuSettingsShape>("legalMenu");

  const visibleFooter = footer.override ?? footer.baseline;
  const visibleLegalMenu = legalMenu.override ?? legalMenu.baseline;

  const ui = useSiteUi();

  if (!visibleFooter || !visibleLegalMenu) {
    return null;
  }

  return (
    <SiteFooter
      footer={visibleFooter}
      legalMenu={visibleLegalMenu}
      ui={ui.footer}
    />
  );
}

FooterPreviewPage.displayName = "FooterPreviewPage";
