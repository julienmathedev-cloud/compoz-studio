"use client";

/**
 * @file apps/studio/src/components/organisms/AdminSidebar.tsx
 * @layer ui/organisms
 *
 * @description
 * Sidebar de navigation de l’admin (route-based).
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Navigation via routes `/dashboard/...` (Linear-like).
 * - Actif dérivé de l’URL via `usePathname()`.
 * - Accessible : navigation clavier + `aria-current="page"`.
 * - Dirty Guard : intercepte les clics “simples” pour confirmer avant navigation.
 */

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useCallback, useMemo } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@compoz/ui/components/ui/sidebar";

import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { cn } from "@compoz/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Cookie, FileText, Shield, Users } from "lucide-react";

import {
  Blocks,
  Files,
  Fingerprint,
  LayoutDashboard,
  Menu,
  PanelBottom,
  PanelTop,
  Search,
  Share2,
} from "lucide-react";

export const ADMIN_SIDEBAR_ICONS = {
  overview: LayoutDashboard,
  identity: Fingerprint,
  menu: Menu,
  social: Share2,
  header: PanelTop,
  footer: PanelBottom,
  pages: Files,
  blocks: Blocks,
  seo: Search,

  // ✅ Admin-only
  users: Users,
} satisfies Record<string, LucideIcon>;

export type AdminSidebarItemKey = keyof typeof ADMIN_SIDEBAR_ICONS;

/**
 * Item de navigation sidebar.
 */
export type AdminSidebarItem = Readonly<{
  /** Clé stable (pour key UI). */
  key: AdminSidebarItemKey;
  /** Libellé visible. */
  label: string;
  /** Href (route admin). Ex: "/identity" */
  href: string;
  /** Désactive l’item. */
  disabled?: boolean;
}>;

type AdminSidebarProps = Readonly<{
  /**
   * Optionnel : titre en haut de sidebar.
   * (ex: "Compoz — Admin")
   */
  title?: string;

  locale: string;

  /** Affiche les items admin-only (ex: Users). */
  isAdmin?: boolean;
}>;

/**
 * Normalise un pathname en supprimant un trailing slash (sauf "/").
 */
function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/"))
    return pathname.slice(0, -1);
  return pathname;
}

/**
 * Détermine si l’évènement est un “clic simple” :
 * - bouton gauche
 * - pas de modifier (Cmd/Ctrl/Shift/Alt)
 * - pas déjà preventDefault
 *
 * @remarks
 * On laisse Next/Browser gérer tous les autres cas (nouvel onglet, nouvelle fenêtre, etc.)
 * pour conserver le comportement standard.
 */
function isPlainLeftClick(e: MouseEvent): boolean {
  if (e.defaultPrevented) return false;
  if (e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  return true;
}

/**
 * Sidebar de l’admin (route-based).
 */
export function AdminSidebar({
  title,
  locale,
  isAdmin = false,
}: AdminSidebarProps) {
  const t = useTranslations();
  const dirtyGuard = useAdminDirtyGuard();

  const pathnameRaw = usePathname();
  const pathname = normalizePathname(pathnameRaw ?? "");
  const base = `/${locale}`;

  const items: ReadonlyArray<AdminSidebarItem> = useMemo(() => {
    const baseItems: AdminSidebarItem[] = [
      {
        key: "overview",
        label: t("admin.dashboard.tabs.overview"),
        href: `${base}`,
      },
      {
        key: "identity",
        label: t("admin.dashboard.tabs.identity"),
        href: `${base}/identity`,
      },
      {
        key: "menu",
        label: t("admin.dashboard.tabs.menu"),
        href: `${base}/menu`,
      },
      {
        key: "social",
        label: t("admin.dashboard.tabs.social"),
        href: `${base}/social`,
      },
      {
        key: "header",
        label: t("admin.dashboard.tabs.header"),
        href: `${base}/header`,
      },
      {
        key: "footer",
        label: t("admin.dashboard.tabs.footer"),
        href: `${base}/footer`,
      },
      {
        key: "pages",
        label: t("admin.dashboard.tabs.pages"),
        href: `${base}/pages`,
      },
      {
        key: "blocks",
        label: t("admin.dashboard.tabs.blocks"),
        href: `${base}/blocks`,
      },
      {
        key: "seo",
        label: t("admin.dashboard.tabs.seo"),
        href: `${base}/seo`,
      },
    ];

    // ✅ Admin-only
    if (isAdmin) {
      baseItems.push({
        key: "users",
        label: t("admin.shared.entities.users"),
        href: `${base}/admin/users`,
      });
    }

    return baseItems;
  }, [t, base, isAdmin]);

  /**
   * Items “Autre” (routes publiques).
   *
   * @remarks
   * - UI-only : on ne gère ici que l’accès aux pages légales.
   * - Dirty Guard : utilisé aussi sur ces liens (navigation safe).
   */
  const otherItems = useMemo(
    () =>
      [
        {
          key: "legal-notices",
          href: `${base}/mentions-legales`,
          label: t("admin.footer.legalNotices"),
          Icon: FileText,
        },
        {
          key: "privacy",
          href: `${base}/confidentialite`,
          label: t("admin.footer.privacy"),
          Icon: Shield,
        },
        {
          key: "cookies",
          href: `${base}/cookies`,
          label: t("admin.footer.cookies"),
          Icon: Cookie,
        },
      ] as const,
    [base, t],
  );

  /**
   * Fabrique un handler de navigation “dirty-aware”.
   */
  const makeNavHandler = useCallback(
    (href: string, disabled?: boolean) => {
      return (e: MouseEvent) => {
        if (disabled) {
          e.preventDefault();
          return;
        }

        // On ne bloque que le clic “simple”.
        // Tous les autres cas doivent rester natifs (nouvel onglet, etc.).
        if (!isPlainLeftClick(e)) return;

        e.preventDefault();
        void dirtyGuard.navigate(href);
      };
    },
    [dirtyGuard],
  );

  return (
    <Sidebar collapsible="icon" className={cn("border-none", "z-50 w-max-100")}>
      <SidebarHeader className="h-12 items-center justify-center">
        <SidebarGroupLabel className="truncate text-2xl text-foreground tracking-tighter font-bold">
          {title ?? "Compoz Studio"}
        </SidebarGroupLabel>
      </SidebarHeader>

      <SidebarContent className="justify-between">
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>

          <nav aria-label={t("common.navigation")}>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.href === `${base}`
                    ? pathname === `${base}`
                    : pathname.startsWith(item.href);

                const Icon = ADMIN_SIDEBAR_ICONS[item.key];

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      aria-current={isActive ? "page" : undefined}
                      disabled={item.disabled}
                    >
                      <Link
                        href={item.href}
                        aria-disabled={item.disabled ? "true" : undefined}
                        onClick={makeNavHandler(item.href, item.disabled)}
                      >
                        <Icon />
                        {item.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </nav>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Autre</SidebarGroupLabel>

          <SidebarMenu>
            {otherItems.map(({ key, href, label, Icon }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton asChild size="sm">
                  <Link
                    href={href}
                    onClick={makeNavHandler(href)}
                    className="text-sm text-muted-foreground"
                  >
                    <Icon />
                    {label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="items-center justify-center">
        <SidebarGroupLabel className="truncate text-sm font-semibold">
          V0.5
        </SidebarGroupLabel>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

AdminSidebar.displayName = "AdminSidebar";
