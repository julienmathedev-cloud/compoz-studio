"use client";

/**
 * @file apps/studio/src/lib/ui/NotifyProvider.tsx
 * @layer studio/lib/ui
 * @description
 * Branche le resolver i18n global pour `notify.fromError()`.
 *
 * @remarks
 * - À monter une seule fois dans le Studio (admin).
 * - Ne rend pas d'UI : il se contente de configurer `notify` et rend `children`.
 */

import { notify } from "@compoz/studio/lib/ui/notify";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";

type NotifyProviderProps = {
  children: ReactNode;
};

export function NotifyProvider({ children }: NotifyProviderProps) {
  const t = useTranslations();

  const resolve = useCallback(
    (key: string) => {
      // next-intl accepte des clés dynamiques en string
      return t(key as never);
    },
    [t],
  );

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
