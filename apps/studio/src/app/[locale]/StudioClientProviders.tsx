"use client";

/**
 * @file apps/studio/src/app/[locale]/StudioClientProviders.tsx
 * @layer studio/app/providers
 *
 * @description
 * Global client providers required by the Studio.
 *
 * @remarks
 * - Must be mounted above the sidebar because it owns `SidebarProvider` and the Dirty Guard.
 * - Exposes the server-resolved active Website through `WebsiteContext` for query
 *   keys and client scopes.
 */

import type { ReactNode } from "react";
import { useMemo } from "react";

import { WebsiteContext } from "@compoz/studio/features/admin/website/WebsiteContext";
import { ConfirmDialogProvider } from "@compoz/studio/features/confirm/ConfirmDialogProvider";
import { StudioDirtyGuardProvider } from "@compoz/studio/features/dirty-guard/StudioDirtyGuardProvider";
import { StudioThemeProvider } from "@compoz/studio/features/theme/StudioThemeProvider";
import { StudioThemeScope } from "@compoz/studio/features/theme/StudioThemeScope";
import { NotifyProvider } from "@compoz/studio/lib/ui/NotifyProvider";
import { SidebarProvider } from "@compoz/ui/components/ui/sidebar";

type StudioClientProvidersProps = Readonly<{
  children: ReactNode;

  /**
   * Website.id resolved server-side through requireSessionWithWebsite().
   *
   * For admins, this reflects the selected active Website. Eventually this
   * should be carried by the "compoz_active_website" httpOnly cookie.
   */
  websiteId: string;

  /**
   * Canonical public Website.slug for the active Website.
   * Used for public URLs, preview, skins, and runtime features.
   */
  websiteSlug: string;

  websiteName?: string;

  hasSidebar?: boolean;
}>;

export function StudioClientProviders({
  children,
  websiteId,
  websiteSlug,
  websiteName,
  hasSidebar = true,
}: StudioClientProvidersProps) {
  const value = useMemo(
    () => ({
      websiteId,
      websiteSlug,
      websiteName,
    }),
    [websiteId, websiteSlug, websiteName],
  );

  const content = hasSidebar ? (
    <SidebarProvider>{children}</SidebarProvider>
  ) : (
    children
  );

  return (
    <>
      {/* Applies the studio-theme class to <html>, including Radix portals. */}
      <StudioThemeScope />

      <WebsiteContext.Provider value={value}>
        <NotifyProvider>
          <StudioThemeProvider>
            <ConfirmDialogProvider>
              <StudioDirtyGuardProvider>{content}</StudioDirtyGuardProvider>
            </ConfirmDialogProvider>
          </StudioThemeProvider>
        </NotifyProvider>
      </WebsiteContext.Provider>
    </>
  );
}

StudioClientProviders.displayName = "StudioClientProviders";
