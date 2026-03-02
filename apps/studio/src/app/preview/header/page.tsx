"use client";

/**
 * @file apps/studio/src/app/preview/header/page.tsx
 * @layer app/preview
 *
 * @description
 * Page de preview pour le Header public.
 *
 * @remarks
 * - Lit les données via `usePreviewOverride` pour header, identity, primaryMenu et social.
 * - Gating strict : on n’affiche rien tant que toutes les baselines nécessaires ne sont pas disponibles.
 * - `header` : override possible (Sync), les autres : baseline only.
 */

import { log } from "@compoz/infra/lib/log";
import { useEffect } from "react";

import { PublicHeader } from "@compoz/ui/site/components/layouts/PublicHeader";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";

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

  // Debug preview (logger central)
  useEffect(() => {
    lg.debug("render", {
      header,
      identity,
      primaryMenu,
      social,
    });
  }, [header, identity, primaryMenu, social]);

  // Règles de résolution : header override > baseline, autres baselines only.
  const visibleHeader = header.override ?? header.baseline;
  const visibleIdentity = identity.baseline;
  const visiblePrimaryMenu = primaryMenu.baseline;
  const visibleSocial = social.baseline;

  // ✅ Empty preview au lieu de `return null`
  if (
    !visibleHeader ||
    !visibleIdentity ||
    !visiblePrimaryMenu ||
    !visibleSocial
  ) {
    return null;
  }

  const ui = resolvePublicUi();

  return (
    <PublicHeader
      header={visibleHeader}
      identity={visibleIdentity}
      primaryMenu={visiblePrimaryMenu}
      social={visibleSocial}
      ui={ui.header}
    />
  );
}

HeaderPreviewPage.displayName = "HeaderPreviewPage";
