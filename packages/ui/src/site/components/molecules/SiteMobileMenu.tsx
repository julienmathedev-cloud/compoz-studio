"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteMobileMenu.tsx
 * @layer ui/site/components
 *
 * @description
 * Menu mobile site (drawer) aligné sur la SoT UI :
 * - liens via `SiteNavLink`
 * - sous-menus via `<details>/<summary>` + `SiteNavLink` children
 * - sociaux via `SiteIconLink` + `renderSocialKindIcon`
 *
 * @remarks
 * - UI-only
 * - A11y : dialog + aria-modal, focus trap, Esc, overlay clickable, scroll lock html
 * - ferme sur changement de route
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

import { DynamicIcon } from "lucide-react/dynamic";
import type dynamicIconImports from "lucide-react/dynamicIconImports";

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { renderSocialKindIcon } from "@compoz/ui/lib/social/social-kind-icons";
import { cn } from "@compoz/ui/lib/utils";
import { SiteIconLink } from "@compoz/ui/site/components/atoms/SiteIconLink";
import { SiteNavLink } from "@compoz/ui/site/components/atoms/SiteNavLink";
import type { SiteMobileMenuUi } from "@compoz/ui/site/site-ui.types";

export type SiteMobileMenuProps = Readonly<{
  primaryMenu: PrimaryMenuSettingsShape;
  social: SocialSettingsShape;
  ui: SiteMobileMenuUi;
  ariaLabel?: string;
  className?: string;
  emptyLabel?: string;
}>;

const ICON_MENU: keyof typeof dynamicIconImports = "menu";
const ICON_CLOSE: keyof typeof dynamicIconImports = "x";
const ICON_CHEVRON: keyof typeof dynamicIconImports = "chevron-down";

const MENU_ID = "site-mobile-menu";

function isActivePath(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteMobileMenu({
  primaryMenu,
  social,
  ui,
  ariaLabel = "Menu",
  className,
  emptyLabel,
}: SiteMobileMenuProps) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const items = primaryMenu.items ?? [];
  const socials = social.items ?? [];

  const hasMenu = items.length > 0;
  const hasSocial = socials.length > 0;

  useEffect(() => {
    setOpen((prev) => (prev ? false : prev));
  }, [pathname]);

  useEffect(() => {
    const html = document.documentElement;

    if (open) {
      html.classList.add("overflow-hidden");
    } else {
      html.classList.remove("overflow-hidden");
    }

    return () => {
      html.classList.remove("overflow-hidden");
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const nodes = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      ),
    );

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && nodes.length) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!hasMenu && !hasSocial) {
    return emptyLabel ? (
      <div className={cn(className, ui.emptyState)}>{emptyLabel}</div>
    ) : null;
  }

  return (
    <div className={cn(className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={MENU_ID}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((value) => !value)}
        className={cn(ui.triggerButton, ui.focusRing)}
      >
        <DynamicIcon
          name={ICON_MENU}
          size={24}
          aria-hidden
          focusable="false"
          className={cn(ui.triggerIcon)}
        />
      </button>

      <div
        aria-hidden={!open}
        className={cn(ui.overlayBase, open ? ui.overlayOpen : ui.overlayClosed)}
        onClick={() => setOpen(false)}
      />

      <div
        id={MENU_ID}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        ref={panelRef}
        className={cn(ui.panelBase, open ? ui.panelOpen : ui.panelClosed)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn(ui.topBar)}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className={cn(ui.closeButton, ui.focusRing)}
          >
            <DynamicIcon
              name={ICON_CLOSE}
              size={20}
              aria-hidden
              focusable="false"
            />
          </button>
        </div>

        <nav className={cn(ui.scrollArea)}>
          {hasMenu ? (
            <ul className={cn(ui.list)}>
              {items.map((item, index) => {
                const children = Array.isArray(item.children)
                  ? item.children
                  : [];
                const href = item.href?.trim() ?? "";
                const label = item.label?.trim() ?? "";
                const key = toStableUiKey({ href: item.href, label }, index);

                if (children.length > 0) {
                  const hasActiveChild = children.some((child) =>
                    isActivePath(pathname, child.href?.trim()),
                  );

                  return (
                    <li key={key} className={cn(ui.item)}>
                      <details
                        className={cn(ui.details)}
                        {...(hasActiveChild ? { open: true } : {})}
                      >
                        <summary
                          className={cn(
                            ui.summary,
                            ui.focusRing,
                            ui.interactive,
                          )}
                          aria-label={label || "Menu"}
                        >
                          <span className="truncate">{label || "Menu"}</span>

                          <DynamicIcon
                            name={ICON_CHEVRON}
                            size={18}
                            aria-hidden
                            focusable="false"
                            className="shrink-0"
                          />
                        </summary>

                        <ul className={cn(ui.dropdownList)}>
                          {children
                            .filter((child) => Boolean(child.href?.trim()))
                            .map((child, childIndex) => {
                              const childHref = child.href!.trim();
                              const childLabel =
                                child.label?.trim() ?? childHref;

                              const childKey = toStableUiKey(
                                { href: childHref, label: childLabel },
                                childIndex,
                              );

                              return (
                                <li key={childKey} className={cn(ui.childItem)}>
                                  <SiteNavLink
                                    href={childHref}
                                    label={childLabel}
                                    ariaLabel={childLabel}
                                    newTab={Boolean(child.newTab)}
                                    className={cn(ui.childInteractive)}
                                    linkClassName={cn(ui.link)}
                                  />
                                </li>
                              );
                            })}
                        </ul>
                      </details>
                    </li>
                  );
                }

                if (href) {
                  return (
                    <li key={key} className={cn(ui.item)}>
                      <SiteNavLink
                        href={href}
                        label={label || href}
                        ariaLabel={label}
                        newTab={Boolean(item.newTab)}
                        className={cn(ui.interactive)}
                        linkClassName={cn(ui.link)}
                      />
                    </li>
                  );
                }

                return null;
              })}
            </ul>
          ) : null}

          {hasSocial ? (
            <div className={cn(ui.socialsRow)}>
              {socials.map((item, index) => (
                <SiteIconLink
                  key={toStableUiKey(
                    { keyId: `${item.kind}:${index}`, href: item.href },
                    index,
                  )}
                  href={item.href}
                  ariaLabel={item.kind}
                  className={cn(ui.socialLink, ui.focusRing)}
                  linkClassName={cn(ui.socialLink)}
                  icon={renderSocialKindIcon(item.kind, {
                    className: cn(ui.socialIcon),
                  })}
                />
              ))}
            </div>
          ) : null}
        </nav>
      </div>
    </div>
  );
}

SiteMobileMenu.displayName = "SiteMobileMenu";
