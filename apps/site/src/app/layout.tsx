/**
 * @file apps/site/src/app/layout.tsx
 * @layer site/app
 *
 * @description
 * Neutral root layout for the public site app.
 *
 * @remarks
 * - Does not resolve any Website.
 * - Does not load published settings.
 * - Website-aware shells live in child layouts:
 *   - `(hosted)` for host-based routing through WebsiteDomain.
 *   - `t/[websiteSlug]` for the explicit fallback through Website.slug.
 */

import type { ReactNode } from "react";

import "@compoz/site/app/globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { cn } from "@compoz/ui/lib/utils";
import { SITE_APP_SHELL } from "@compoz/ui/styles/site/layout";

type LayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html id="app-site" lang="fr" className="overscroll-none h-dvh theme-site">
      <body className={cn("antialiased", SITE_APP_SHELL)}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
