"use client";

/**
 * @file apps/studio/src/components/organisms/StudioSidebar.tsx
 * @layer studio/organisms
 *
 * @description
 * Route-based Studio navigation sidebar.
 *
 * @remarks
 * - Active state is derived from the URL via `usePathname()`.
 * - Uses `aria-current="page"` for the active route.
 * - Dirty Guard intercepts plain clicks to confirm before navigation.
 */

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useCallback, useMemo } from "react";

import { STUDIO_PATH } from "@compoz/core/constants/web/paths";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";

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
import { cn } from "@compoz/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Cookie,
  Files,
  FileText,
  Fingerprint,
  LayoutDashboard,
  Menu,
  Palette,
  PanelBottom,
  PanelTop,
  Search,
  Share2,
  Shield,
  Users,
} from "lucide-react";

export const STUDIO_SIDEBAR_ICONS = {
  overview: LayoutDashboard,
  identity: Fingerprint,
  menu: Menu,
  social: Share2,
  header: PanelTop,
  footer: PanelBottom,
  pages: Files,
  blocks: Blocks,
  theme: Palette,
  seo: Search,

  // Studio-only
  users: Users,
} satisfies Record<string, LucideIcon>;

export type StudioSidebarItemKey = keyof typeof STUDIO_SIDEBAR_ICONS;

export type StudioSidebarItem = Readonly<{
  key: StudioSidebarItemKey;
  label: string;
  href: string;
  disabled?: boolean;
}>;

type StudioSidebarProps = Readonly<{
  /** Optional title displayed at the top of the sidebar. */
  title?: string;

  locale: string;

  isAdmin?: boolean;
}>;

/**
 * Normalizes a pathname by removing the trailing slash except for `/`.
 */
function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/"))
    return pathname.slice(0, -1);
  return pathname;
}

/**
 * Determines whether the event is a plain click:
 * - left mouse button
 * - no modifier key (Cmd/Ctrl/Shift/Alt)
 * - not already prevented
 *
 * @remarks
 * Let Next/the browser handle every other case (new tab, new window, etc.)
 * to preserve standard behavior.
 */
function isPlainLeftClick(e: MouseEvent): boolean {
  if (e.defaultPrevented) return false;
  if (e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  return true;
}

/** Route-based Studio sidebar. */
export function StudioSidebar({
  title,
  locale,
  isAdmin = false,
}: StudioSidebarProps) {
  const t = useTranslations();
  const dirtyGuard = useStudioDirtyGuard();

  const pathnameRaw = usePathname();
  const pathname = normalizePathname(pathnameRaw ?? "");
  const base = `/${locale}`;

  const items: ReadonlyArray<StudioSidebarItem> = useMemo(() => {
    const baseItems: StudioSidebarItem[] = [
      {
        key: "overview",
        label: t("studio.dashboard.tabs.overview"),
        href: `${base}`,
      },
      {
        key: "identity",
        label: t("studio.dashboard.tabs.identity"),
        href: base + STUDIO_PATH.identity,
      },
      {
        key: "menu",
        label: t("studio.dashboard.tabs.menu"),
        href: base + STUDIO_PATH.menu,
      },
      {
        key: "social",
        label: t("studio.dashboard.tabs.social"),
        href: base + STUDIO_PATH.social,
      },
      {
        key: "header",
        label: t("studio.dashboard.tabs.header"),
        href: base + STUDIO_PATH.header,
      },
      {
        key: "footer",
        label: t("studio.dashboard.tabs.footer"),
        href: base + STUDIO_PATH.footer,
      },
      {
        key: "pages",
        label: t("studio.dashboard.tabs.pages"),
        href: base + STUDIO_PATH.pages,
      },
      {
        key: "blocks",
        label: t("studio.dashboard.tabs.blocks"),
        href: base + STUDIO_PATH.blocks,
      },
      {
        key: "seo",
        label: t("studio.dashboard.tabs.seo"),
        href: base + STUDIO_PATH.seo,
      },
    ];

    // Admin-only navigation items.
    if (isAdmin) {
      baseItems.push(
        {
          key: "theme",
          label: t("studio.dashboard.tabs.theme"),
          href: base + STUDIO_PATH.theme,
        },
        {
          key: "users",
          label: t("studio.shared.entities.users"),
          href: base + STUDIO_PATH.adminPath.users,
        },
      );
    }

    return baseItems;
  }, [t, base, isAdmin]);

  /** Legal-page links also use the Dirty Guard before navigation. */
  const otherItems = useMemo(
    () =>
      [
        {
          key: "legal-notices",
          href: base + STUDIO_PATH.mentionsLegales,
          label: t("studio.footer.legalNotices"),
          Icon: FileText,
        },
        {
          key: "privacy",
          href: base + STUDIO_PATH.confidentialite,
          label: t("studio.footer.privacy"),
          Icon: Shield,
        },
        {
          key: "cookies",
          href: base + STUDIO_PATH.cookies,
          label: t("studio.footer.cookies"),
          Icon: Cookie,
        },
      ] as const,
    [base, t],
  );

  const makeNavHandler = useCallback(
    (href: string, disabled?: boolean) => {
      return (e: MouseEvent) => {
        if (disabled) {
          e.preventDefault();
          return;
        }

        // Only plain clicks are blocked.
        // All other cases must keep native behavior (new tab, etc.).
        if (!isPlainLeftClick(e)) return;

        e.preventDefault();
        void dirtyGuard.navigate(href);
      };
    },
    [dirtyGuard],
  );

  return (
    <Sidebar
      collapsible="icon"
      visualMode="studio"
      className={cn("border-none", "z-50 w-max-100")}
    >
      <SidebarHeader className="flex h-12 items-center justify-between px-2">
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

                const Icon = STUDIO_SIDEBAR_ICONS[item.key];

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

StudioSidebar.displayName = "StudioSidebar";
