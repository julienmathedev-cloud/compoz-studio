"use client";

/**
 * @file apps/studio/src/features/dirty-guard/StudioDirtyGuardProvider.tsx
 * @layer studio/dirty-guard
 *
 * @description
 * Provider global du Dirty Guard pour Studio (route-based).
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Empêche la navigation si la page courante contient des changements non sauvegardés.
 * - Centralise la confirmation utilisateur via `useConfirmList()`.
 * - Gère aussi la protection `beforeunload` (refresh / fermeture onglet).
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
  /** Marque la route courante comme dirty/clean. */
  setDirty: (dirty: boolean) => void;
  /** État dirty de la route courante (pour UI). */
  isDirty: boolean;
  /** Lecture à la demande (évite les soucis de stale state dans navigate/beforeunload). */
  getIsDirty: () => boolean;
  /** Navigation dirty-aware (confirmation si nécessaire). */
  navigate: (href: string) => Promise<void>;
}>;

export const StudioDirtyGuardContext =
  createContext<StudioDirtyGuardContextValue | null>(null);

/**
 * Normalise un pathname en supprimant le trailing slash (sauf "/").
 */
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

  /** Registre dirty par route. */
  const dirtyByPathRef = useRef<Record<string, boolean>>({});
  const isConfirmingRef = useRef(false);

  /** UI sync pour la route courante uniquement. */
  const [isDirtyState, setIsDirtyState] = useState(false);

  useEffect(() => {
    if (!pathname) return;
    setIsDirtyState(Boolean(dirtyByPathRef.current[pathname]));
  }, [pathname]);

  const setDirty = useCallback(
    (dirty: boolean) => {
      if (!pathname) return;
      dirtyByPathRef.current[pathname] = dirty;

      // ✅ déclenche un rerender pour la route courante
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

      // ✅ pas dirty => navigation directe
      if (!getIsDirty()) {
        router.push(nextHref);
        return;
      }

      // ✅ anti double-confirm
      if (isConfirmingRef.current) return;
      isConfirmingRef.current = true;

      try {
        const ok = await confirmLeave();
        if (!ok) return;

        // ✅ reset dirty courant + UI sync
        dirtyByPathRef.current[pathname] = false;
        setIsDirtyState(false);

        router.push(nextHref);
      } finally {
        isConfirmingRef.current = false;
      }
    },
    [confirmLeave, getIsDirty, pathname, router],
  );

  /**
   * Protection refresh / fermeture onglet.
   */
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
