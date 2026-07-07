"use client";

/**
 * @file apps/studio/src/lib/ui/NotifyProvider.tsx
 * @layer studio/lib/ui
 *
 * @description
 * Connects the global i18n resolver used by Studio notifications.
 *
 * @remarks
 * - Must be mounted once in the Studio app so `notify.fromError()` can resolve i18n tokens.
 * - Renders no UI of its own and only returns `children`.
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
      // next-intl accepts runtime-built keys as strings.
      return t(key);
    },
    [t],
  );

  useEffect(() => {
    notify.configure({ resolve });

    return () => {
      // Clear the resolver on unmount so later notifications do not use a stale translator.
      notify.configure({ resolve: undefined });
    };
  }, [resolve]);

  return children;
}

NotifyProvider.displayName = "NotifyProvider";
