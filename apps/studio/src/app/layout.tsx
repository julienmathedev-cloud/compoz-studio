/**
 * @file apps/studio/src/app/layout.tsx
 * @layer studio/app
 *
 * @description
 * Root layout Studio (HTML/BODY + CSS globaux + fonts) — App Router.
 *
 * @remarks
 * - Root app (Studio/admin) du monorepo.
 * - La localisation peut être gérée dans `app/[locale]/layout.tsx` si la structure est locale-first.
 * - `metadata` minimal (wiring SEO plus tard via settings).
 */

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "@compoz/studio/app/globals.css";
import { cn } from "@compoz/ui/lib/utils";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compoz Studio",
  description:
    "Compoz Studio est une interface d’administration permettant de créer, gérer et publier des sites web simplement.",
  robots: {
    index: false,
    follow: false,
  },
};

type StudioRootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function StudioRootLayout({ children }: StudioRootLayoutProps) {
  return (
    <html
      id="app-studio"
      lang="fr"
      className={cn(
        // Expose `--font-sans` pour la stack UI (si utilisée par Tailwind/base.css).
        nunitoSans.variable,
        "overscroll-none",
      )}
    >
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased overflow-hidden",
        )}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
