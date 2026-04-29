/**
 * @file apps/site/src/app/layout.tsx
 * @layer site/app
 *
 * @description
 * Layout racine neutre du site public.
 *
 * @remarks
 * - Ne résout aucun tenant.
 * - Ne charge aucun settings publié.
 * - Les shells tenant-aware vivent dans des layouts enfants :
 *   - `(hosted)` pour le mode host-based
 *   - `t/[tenantId]` pour le mode fallback explicite
 */

import type { ReactNode } from "react";

import "@compoz/site/app/globals.css";

import { cn } from "@compoz/ui/lib/utils";
import { SITE_APP_SHELL } from "@compoz/ui/styles/site/layout";

type LayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html id="app-site" lang="fr" className="overscroll-none h-dvh theme-site">
      <body className={cn("antialiased", SITE_APP_SHELL)}>{children}</body>
    </html>
  );
}
