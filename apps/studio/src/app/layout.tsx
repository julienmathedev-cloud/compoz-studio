/**
 * @file apps/studio/src/app/layout.tsx
 * @layer app/studio/layout
 *
 * @description
 * Root layout Studio (HTML/BODY + CSS globaux + fonts) — App Router.
 *
 * @remarks
 * - Root admin app (monorepo).
 * - La localisation peut rester gérée dans app/[locale]/layout.tsx si tu en as un côté admin,
 *   sinon ici suffit.
 * - `metadata` minimal (wiring SEO plus tard via settings).
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "@compoz/studio/app/globals.css";
import { cn } from "@compoz/ui/lib/utils";

const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compoz studio — Admin",
  description: "Administration panel for Compoz Studio",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      id="app-root"
      lang="fr"
      className={cn(nunitoSans.variable, "overscroll-none")}
    >
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased overflow-hidden",
        )}
      >
        {children}
      </body>
    </html>
  );
}
