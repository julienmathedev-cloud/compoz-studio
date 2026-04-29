"use client";

/**
 * @file apps/studio/src/features/preview/PreviewShell.tsx
 * @layer ui/studio/preview
 *
 * @description
 * Shell Preview (iframe studio) : injecte le chrome public (Header/Footer)
 * en se basant sur les baselines preview (React Query + postMessage).
 *
 * @remarks
 * - Obligatoirement client : dépend de `usePreviewOverride()`.
 * - Source de vérité : baselines `header` / `identity` / `primaryMenu` / `social` / `footer` / `legalMenu`.
 * - Ne gère pas la page en elle-même : rend uniquement `{children}` dans le `<main>`.
 * - Le skin UI est reçu en props depuis la page preview.
 */

import type { ReactNode } from "react";

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { cn } from "@compoz/ui/lib/utils";
import { SiteFooter } from "@compoz/ui/site/components/layouts/SiteFooter";
import { SiteHeader } from "@compoz/ui/site/components/layouts/SiteHeader";
import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";
import { SITE_APP_COLUMN, SITE_MAIN } from "@compoz/ui/styles/site/layout";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

export type PreviewShellProps = Readonly<{
  children: ReactNode;
  ui: SiteGlobalUi;
}>;

export function PreviewShell({ children, ui }: PreviewShellProps) {
  const header = usePreviewOverride<HeaderSettingsShape>("header");
  const identity = usePreviewOverride<IdentitySettingsShape>("identity");
  const primaryMenu =
    usePreviewOverride<PrimaryMenuSettingsShape>("primaryMenu");
  const social = usePreviewOverride<SocialSettingsShape>("social");
  const footer = usePreviewOverride<FooterSettingsShape>("footer");
  const legalMenu = usePreviewOverride<LegalMenuSettingsShape>("legalMenu");

  const visibleHeader = header.baseline;
  const visibleIdentity = identity.baseline;
  const visiblePrimaryMenu = primaryMenu.baseline;
  const visibleSocial = social.baseline;
  const visibleFooter = footer.baseline;
  const visibleLegalMenu = legalMenu.baseline;

  if (
    !visibleHeader ||
    !visibleIdentity ||
    !visiblePrimaryMenu ||
    !visibleSocial ||
    !visibleFooter ||
    !visibleLegalMenu
  ) {
    return null;
  }

  return (
    <div className={cn(SITE_APP_COLUMN)}>
      <SiteHeader
        header={visibleHeader}
        identity={visibleIdentity}
        primaryMenu={visiblePrimaryMenu}
        social={visibleSocial}
        ui={ui.header}
        logoDisabled={true}
      />

      <main className={cn(SITE_MAIN)}>{children}</main>

      <SiteFooter
        footer={visibleFooter}
        legalMenu={visibleLegalMenu}
        ui={ui.footer}
      />
    </div>
  );
}

PreviewShell.displayName = "PreviewShell";
