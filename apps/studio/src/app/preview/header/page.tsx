"use client";

/**
 * @file apps/studio/src/app/preview/header/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview (iframe) pour le Header du site.
 *
 * @remarks
 * - Lit les données via `usePreviewOverride` pour header, identity, primaryMenu et social.
 * - Gating strict : ne rend rien tant que toutes les baselines nécessaires ne sont pas disponibles
 *   (l’empty state est géré par le wrapper preview).
 * - `header` : override possible (sync), les autres : baseline only.
 * - Le skin UI est fourni par `SiteUiProvider` monté dans `PreviewProviders`.
 * - Le thème CSS est fourni par `ThemeProvider` monté dans `PreviewProviders`.
 */

import { useEffect } from "react";

import { log } from "@compoz/infra/lib/log";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { SiteHeader } from "@compoz/ui/site/components/layouts/SiteHeader";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

/* -------------------------------------------------------------------------- */
/* Logger                                                                     */
/* -------------------------------------------------------------------------- */

const lg = log.child({
  ns: "preview",
  area: "header",
  name: "HeaderPreviewPage",
});

export default function HeaderPreviewPage() {
  const header = usePreviewOverride<HeaderSettingsShape>("header");
  const identity = usePreviewOverride<IdentitySettingsShape>("identity");
  const primaryMenu =
    usePreviewOverride<PrimaryMenuSettingsShape>("primaryMenu");
  const social = usePreviewOverride<SocialSettingsShape>("social");

  const ui = useSiteUi();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      lg.debug("render", { header, identity, primaryMenu, social });
    }
  }, [header, identity, primaryMenu, social]);

  // Règles de résolution : header override > baseline, autres baselines only.
  const visibleHeader = header.override ?? header.baseline;
  const visibleIdentity = identity.baseline;
  const visiblePrimaryMenu = primaryMenu.baseline;
  const visibleSocial = social.baseline;

  // Empty state géré par le wrapper preview
  if (
    !visibleHeader ||
    !visibleIdentity ||
    !visiblePrimaryMenu ||
    !visibleSocial
  ) {
    return null;
  }

  return (
    <SiteHeader
      header={visibleHeader}
      identity={visibleIdentity}
      primaryMenu={visiblePrimaryMenu}
      social={visibleSocial}
      ui={ui.header}
      logoDisabled={true}
    />
  );
}

HeaderPreviewPage.displayName = "HeaderPreviewPage";
