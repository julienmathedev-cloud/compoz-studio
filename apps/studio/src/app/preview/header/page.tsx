"use client";

/**
 * @file apps/studio/src/app/preview/header/page.tsx
 * @layer studio/app
 *
 * @description
 * Iframe preview page for the site header.
 *
 * @remarks
 * - Reads header, identity, primary menu, and social data through `usePreviewOverride`.
 * - Uses strict gating: renders nothing until all required baselines are available
 *   because the empty state is handled by the preview wrapper.
 * - `header` can be overridden through sync; other values are baseline-only.
 * - The UI skin is provided by `SiteUiProvider` mounted in `PreviewProviders`.
 * - The CSS theme is provided by `ThemeProvider` mounted in `PreviewProviders`.
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

  // Resolution rules: header override > baseline; other values are baseline-only.
  const visibleHeader = header.override ?? header.baseline;
  const visibleIdentity = identity.baseline;
  const visiblePrimaryMenu = primaryMenu.baseline;
  const visibleSocial = social.baseline;

  // Empty state is handled by the preview wrapper.
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
