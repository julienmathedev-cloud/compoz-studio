"use client";

/**
 * @file apps/studio/src/features/shell/components/AdminShell.tsx
 * @layer ui/layouts
 *
 * @description
 * Shell client-side pour l’interface d’administration.
 *
 * @remarks
 * - Évite le rendu SSR de composants sensibles (Radix, useId, etc.).
 * - S’appuie sur `useIsMounted` pour différer le rendu complet.
 * - Affiche un conteneur accessible pendant la phase de montage.
 */
import { useIsMounted } from "@compoz/ui/hooks/useIsMounted";
import { SectionLoader } from "@compoz/studio/components/loading/SectionLoader";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type AdminShellProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Shell principal de l’interface d’administration.
 *
 * @param children Contenu admin à rendre une fois monté côté client.
 */
export function AdminShell({ children }: AdminShellProps) {
  const isMounted = useIsMounted();
  const t = useTranslations();
  const label = t("admin.shell.loading");

  if (!isMounted) {
    // Pas encore monté côté client → on évite de rendre Tabs/Dialog/etc.
    return <SectionLoader label={label} />;
  }

  // Une fois monté → on rend tout l’admin normalement (Dashboard, Tabs, etc.)
  return <>{children}</>;
}

AdminShell.displayName = "AdminShell";
