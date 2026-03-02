"use client";

/**
 * @file apps/studio/src/app/preview/footer/page.tsx
 * @layer app/preview
 *
 * @description
 * Page de preview pour le pied de page public.
 */

import { log } from "@compoz/infra/lib/log";
import { PublicFooter } from "@compoz/ui/site/components/layouts/PublicFooter";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { useEffect } from "react";

const lg = log.child({
  ns: "preview",
  area: "footer",
  name: "FooterPreviewPage",
});

export default function FooterPreviewPage() {
  const footer = usePreviewOverride<FooterSettingsShape>("footer");
  const legalMenu = usePreviewOverride<LegalMenuSettingsShape>("legalMenu");

  useEffect(() => {
    lg.debug("render", { footer, legalMenu });
  }, [footer, legalMenu]);

  const visibleFooter = footer.override ?? footer.baseline;
  const visibleLegalMenu = legalMenu.override ?? legalMenu.baseline;

  // ✅ Empty preview au lieu de `return null`
  if (!visibleFooter || !visibleLegalMenu) {
    return null;
  }

  const ui = resolvePublicUi();

  return (
    <PublicFooter
      footer={visibleFooter}
      legalMenu={visibleLegalMenu}
      ui={ui.footer}
    />
  );
}

FooterPreviewPage.displayName = "FooterPreviewPage";
