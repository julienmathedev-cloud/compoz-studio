"use client";

/**
 * @file apps/studio/src/features/dirty-guard/AdminDirtyGuardProvider.tsx
 * @layer hooks/admin
 *
 * @description
 * Provider global du Dirty Guard pour l’admin (route-based).
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Empêche la navigation si la page courante contient des changements non sauvegardés.
 * - Centralise la confirmation utilisateur (ConfirmDialog).
 */

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

type AdminDirtyGuardContextValue = Readonly<{
  setDirty: (dirty: boolean) => void;
  isDirty: boolean;
  /** Lecture à la demande (utile dans navigate/beforeunload pour éviter les soucis de stale state). */
  getIsDirty: () => boolean;
  navigate: (href: string) => Promise<void>;
}>;

export const AdminDirtyGuardContext =
  createContext<AdminDirtyGuardContextValue | null>(null);

/**
 * Normalise un pathname (supprime le trailing slash).
 */
function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

type AdminDirtyGuardProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function AdminDirtyGuardProvider({
  children,
}: AdminDirtyGuardProviderProps) {
  const router = useRouter();
  const pathname = normalizePathname(usePathname() ?? "");
  const t = useTranslations();
  const confirmList = useConfirmList();

  /** Registre dirty par route */
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
      // ✅ déclenche un rerender pour la route courante
      setIsDirtyState(dirty);
    },
    [pathname],
  );

  const getIsDirty = useCallback(() => {
    if (!pathname) return false;
    return Boolean(dirtyByPathRef.current[pathname]);
  }, [pathname]);

  const confirmLeave = useCallback(async () => {
    return confirmList({
      title: t("admin.shared.confirm.dirty.title"),
      intro: t("admin.shared.confirm.dirty.intro"),
      items: [],
      confirmLabel: t("admin.shared.confirm.dirty.confirmLabel"),
      cancelLabel: t("admin.shared.confirm.dirty.cancelLabel"),
      requireAckLabel: t("admin.shared.confirm.dirty.requireAckLabel"),
      tone: "default",
    });
  }, [confirmList, t]);

  const navigate = useCallback(
    async (href: string) => {
      if (!href || href === pathname) return;

      if (!getIsDirty()) {
        router.push(href);
        return;
      }

      if (isConfirmingRef.current) return;
      isConfirmingRef.current = true;

      try {
        const ok = await confirmLeave();
        if (!ok) return;

        dirtyByPathRef.current[pathname] = false;
        setIsDirtyState(false); // ✅ UI sync
        router.push(href);
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
    () => ({
      setDirty,
      isDirty: isDirtyState,
      getIsDirty,
      navigate,
    }),
    [setDirty, isDirtyState, getIsDirty, navigate],
  );

  return (
    <AdminDirtyGuardContext.Provider value={value}>
      {children}
    </AdminDirtyGuardContext.Provider>
  );
}

AdminDirtyGuardProvider.displayName = "AdminDirtyGuardProvider";
