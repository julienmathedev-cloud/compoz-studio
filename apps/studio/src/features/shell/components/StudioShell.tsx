"use client";

/**
 * @file apps/studio/src/features/shell/components/StudioShell.tsx
 * @layer ui/studio/layouts
 *
 * @description
 * Shell client-side pour l’interface Studio.
 *
 * @remarks
 * - Évite le rendu SSR de composants sensibles (Radix, useId, etc.).
 * - S’appuie sur `useIsMounted` pour différer le rendu complet.
 * - Affiche un conteneur accessible pendant la phase de montage.
 */

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

import { SectionLoader } from "@compoz/studio/components/loading/SectionLoader";
import { useIsMounted } from "@compoz/ui/hooks/useIsMounted";

type StudioShellProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Shell principal de l’interface Studio.
 *
 * @param children Contenu Studio à rendre une fois monté côté client.
 */
export function StudioShell({ children }: StudioShellProps) {
  const isMounted = useIsMounted();
  const t = useTranslations();
  const label = t("studio.shell.loading");

  if (!isMounted) {
    // Pas encore monté côté client → on évite de rendre Tabs/Dialog/etc.
    return <SectionLoader label={label} />;
  }

  // Une fois monté → on rend tout le Studio normalement (Dashboard, Tabs, etc.)
  return <>{children}</>;
}

StudioShell.displayName = "StudioShell";
