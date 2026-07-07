"use client";

/**
 * @file apps/studio/src/features/dirty-guard/StudioDirtyGuardProvider.tsx
 * @layer studio/features/dirty-guard
 *
 * @description
 * Route-scoped Dirty Guard provider for Studio navigation.
 *
 * @remarks
 * - Tracks dirty state per normalized pathname so different Studio routes stay isolated.
 * - Blocks internal navigation through `navigate()` when the current route has unsaved changes.
 * - Centralizes the leave confirmation through `useConfirmList()`.
 * - Adds `beforeunload` protection for refresh and tab close paths.
 * - Guards against opening multiple confirmations for the same pending navigation.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";

type StudioDirtyGuardContextValue = Readonly<{
  setDirty: (dirty: boolean) => void;
  isDirty: boolean;
  getIsDirty: () => boolean;
  navigate: (href: string) => Promise<void>;
}>;

export const StudioDirtyGuardContext =
  createContext<StudioDirtyGuardContextValue | null>(null);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/"))
    return pathname.slice(0, -1);
  return pathname;
}

type StudioDirtyGuardProviderProps = Readonly<{
  children: ReactNode;
}>;

export function StudioDirtyGuardProvider({
  children,
}: StudioDirtyGuardProviderProps) {
  const router = useRouter();
  const pathname = normalizePathname(usePathname() ?? "");
  const t = useTranslations();
  const confirmList = useConfirmList();

  /** Dirty registry keyed by normalized pathname. */
  const dirtyByPathRef = useRef<Record<string, boolean>>({});
  const isConfirmingRef = useRef(false);

  const [isDirtyState, setIsDirtyState] = useState(false);

  useEffect(() => {
    if (!pathname) return;
    setIsDirtyState(Boolean(dirtyByPathRef.current[pathname]));
  }, [pathname]);

  const setDirty = useCallback(
    (dirty: boolean) => {
      if (!pathname) return;
      dirtyByPathRef.current[pathname] = dirty;

      setIsDirtyState(Boolean(dirty));
    },
    [pathname],
  );

  const getIsDirty = useCallback(() => {
    if (!pathname) return false;
    return Boolean(dirtyByPathRef.current[pathname]);
  }, [pathname]);

  const confirmLeave = useCallback(async () => {
    return confirmList({
      title: t("studio.shared.confirm.dirty.title"),
      intro: t("studio.shared.confirm.dirty.intro"),
      items: [],
      confirmLabel: t("studio.shared.confirm.dirty.confirmLabel"),
      cancelLabel: t("studio.shared.confirm.dirty.cancelLabel"),
      requireAckLabel: t("studio.shared.confirm.dirty.requireAckLabel"),
      tone: "default",
    });
  }, [confirmList, t]);

  const navigate = useCallback(
    async (href: string) => {
      const nextHref = String(href ?? "").trim();
      if (!nextHref || nextHref === pathname) return;

      if (!getIsDirty()) {
        router.push(nextHref);
        return;
      }

      // Prevent multiple confirmations for the same pending navigation.
      if (isConfirmingRef.current) return;
      isConfirmingRef.current = true;

      try {
        const ok = await confirmLeave();
        if (!ok) return;

        dirtyByPathRef.current[pathname] = false;
        setIsDirtyState(false);

        router.push(nextHref);
      } finally {
        isConfirmingRef.current = false;
      }
    },
    [confirmLeave, getIsDirty, pathname, router],
  );

  /** Protects refresh and tab close paths through the browser beforeunload flow. */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!getIsDirty()) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [getIsDirty]);

  const value = useMemo(
    () =>
      ({
        setDirty,
        isDirty: isDirtyState,
        getIsDirty,
        navigate,
      }) as const,
    [setDirty, isDirtyState, getIsDirty, navigate],
  );

  return (
    <StudioDirtyGuardContext.Provider value={value}>
      {children}
    </StudioDirtyGuardContext.Provider>
  );
}

StudioDirtyGuardProvider.displayName = "StudioDirtyGuardProvider";
