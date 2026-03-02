"use client";

/**
 * @file apps/studio/src/features/preview/PreviewShell.tsx
 * @layer ui/preview
 *
 * @description
 * Shell Preview (iframe admin) : injecte le chrome public (Header/Footer)
 * + le skin UI public, en se basant sur les baselines preview (React Query + postMessage).
 *
 * @remarks
 * - Obligatoirement client : dépend de `usePreviewOverride()`.
 * - Source de vérité : baselines "header/identity/menus/social/footer/legalMenu".
 * - Ne gère pas la page en elle-même : rend uniquement `{children}` dans le <main>.
 * - Scalable multi-skins : tu changes `resolvePreviewUi()` plus tard.
 */

import { cn } from "@compoz/ui/lib/utils";
import { PublicFooter } from "@compoz/ui/site/components/layouts/PublicFooter";
import { PublicHeader } from "@compoz/ui/site/components/layouts/PublicHeader";
import { PublicUiProvider } from "@compoz/ui/site/providers/PublicUiProvider";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";
import { PUBLIC_APP_COLUMN, PUBLIC_MAIN } from "@compoz/ui/styles/site/layout";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { ReactNode } from "react";

export type PreviewShellProps = Readonly<{
  children: ReactNode;
}>;

export function PreviewShell({ children }: PreviewShellProps) {
  // Baselines settings (read-only) : identique à ton PagePreviewClient.
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

  const ui = resolvePublicUi();

  // Gating strict : pas de “shell” tant que les baselines ne sont pas là.
  // (Même philosophie que ton overview/page preview.)
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
    <>
      <PublicUiProvider ui={ui}>
        <div className={cn(PUBLIC_APP_COLUMN)}>
          <PublicHeader
            header={visibleHeader}
            identity={visibleIdentity}
            primaryMenu={visiblePrimaryMenu}
            social={visibleSocial}
            ui={ui.header}
          />

          <main className={cn(PUBLIC_MAIN)}>{children}</main>

          <PublicFooter
            footer={visibleFooter}
            legalMenu={visibleLegalMenu}
            ui={ui.footer}
          />
        </div>
      </PublicUiProvider>
    </>
  );
}

PreviewShell.displayName = "PreviewShell";
