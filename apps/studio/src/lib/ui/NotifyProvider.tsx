"use client";

/**
 * @file apps/studio/src/lib/ui/NotifyProvider.tsx
 * @layer lib/ui
 * @description
 * Branche le resolver i18n global pour `notify.fromError()`.
 *
 * @remarks
 * - À monter une seule fois dans l’admin.
 * - Ne rend rien : ne fait que configurer `notify`.
 */

import { notify } from "@compoz/studio/lib/ui/notify";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

type NotifyProviderProps = {
  children: ReactNode;
};

export function NotifyProvider({ children }: NotifyProviderProps) {
  const t = useTranslations();

  const resolve = useMemo(() => {
    // next-intl accepte des clés dynamiques en string
    return (key: string) => t(key as never);
  }, [t]);

  useEffect(() => {
    notify.configure({ resolve });
    return () => {
      // évite de garder un resolver obsolète si le Provider est démonté
      notify.configure({ resolve: undefined });
    };
  }, [resolve]);

  return children;
}

NotifyProvider.displayName = "NotifyProvider";
