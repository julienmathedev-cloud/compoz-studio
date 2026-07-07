"use client";

/**
 * @file apps/studio/src/features/shell/components/StudioShell.tsx
 * @layer studio/features/shell/components
 *
 * @description
 * Client-side shell for rendering the Studio after hydration.
 *
 * @remarks
 * - Defers Radix/useId-sensitive UI until the app is mounted on the client.
 * - Shows an accessible loader during the client-mount phase.
 */

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

import { SectionLoader } from "@compoz/studio/components/loading/SectionLoader";
import { useIsMounted } from "@compoz/ui/hooks/useIsMounted";

type StudioShellProps = Readonly<{
  children: ReactNode;
}>;

export function StudioShell({ children }: StudioShellProps) {
  const isMounted = useIsMounted();
  const t = useTranslations();
  const label = t("studio.shell.loading");

  if (!isMounted) {
    return <SectionLoader label={label} className="h-full" />;
  }

  return <>{children}</>;
}

StudioShell.displayName = "StudioShell";
