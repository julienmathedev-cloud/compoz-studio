"use client";

/**
 * @file apps/studio/src/app/preview/footer/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview (iframe) pour le Footer du site.
 */

import { useEffect } from "react";

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

import { SiteFooter } from "@compoz/ui/site/components/layouts/SiteFooter";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function FooterPreviewPage() {
  const footer = usePreviewOverride<FooterSettingsShape>("footer");
  const legalMenu = usePreviewOverride<LegalMenuSettingsShape>("legalMenu");

  const visibleFooter = footer.override ?? footer.baseline;
  const visibleLegalMenu = legalMenu.override ?? legalMenu.baseline;

  if (!visibleFooter || !visibleLegalMenu) {
    return null;
  }

  const ui = resolveSiteUi();

  return (
    <SiteFooter
      footer={visibleFooter}
      legalMenu={visibleLegalMenu}
      ui={ui.footer}
    />
  );
}

FooterPreviewPage.displayName = "FooterPreviewPage";
