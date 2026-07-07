"use client";

/**
 * @file packages/ui/src/site/components/organisms/SitePrimaryMenu.tsx
 * @layer ui/site/components/organisms
 *
 * @description
 * Renders the public site primary menu with root links and dropdown children.
 *
 * @remarks
 * Returns nothing when no item is available; simple links are delegated to `SiteNavLink`, and parent items with children are delegated to `SiteNavDropdown`.
 */

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  collectSectionIds,
  useActiveSection,
} from "@compoz/ui/hooks/useActiveSection";
import { cn } from "@compoz/ui/lib/utils";
import {
  SiteNavActiveSectionProvider,
  SiteNavLink,
} from "@compoz/ui/site/components/atoms/SiteNavLink";
import { SiteNavDropdown } from "@compoz/ui/site/components/molecules/SiteNavDropdown";
import type { SitePrimaryMenuUi } from "@compoz/ui/site/site-ui.types";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

export type SitePrimaryMenuProps = Readonly<{
  settings: PrimaryMenuSettingsShape;

  ui: SitePrimaryMenuUi;
}>;

export function SitePrimaryMenu({ settings, ui }: SitePrimaryMenuProps) {
  const pathname = usePathname() || "/";
  const items = Array.isArray(settings?.items) ? settings.items : [];
  const sectionIds = useMemo(
    () => collectSectionIds(items, pathname),
    [items, pathname],
  );
  const activeSectionId = useActiveSection(sectionIds);

  if (items.length === 0) {
    return null;
  }

  return (
    <SiteNavActiveSectionProvider activeSectionId={activeSectionId}>
      <ul className={cn(ui.list)}>
        {items.map((item) => {
          const id = item.id?.trim() ?? "";
          const href = item.href?.trim() ?? "";
          const label = item.label?.trim() ?? "";

          const children = Array.isArray(item.children) ? item.children : [];
          const safeChildren = children.reduce<
            Array<
              Readonly<{
                id: string;
                href: string;
                label: string;
                ariaLabel?: string;
                newTab?: boolean;
              }>
            >
          >((acc, child) => {
            const childId = child.id?.trim() ?? "";
            const childHref = child.href?.trim() ?? "";
            const childLabel = child.label?.trim() ?? "";

            if (!childId || !childHref || !childLabel) {
              return acc;
            }

            acc.push({
              id: childId,
              href: childHref,
              label: childLabel,
              ariaLabel: childLabel,
              newTab: Boolean(child.newTab),
            });

            return acc;
          }, []);

          const hasChildren = safeChildren.length > 0;
          const hasLink = Boolean(href);

          if (!id) {
            return null;
          }

          if (!hasChildren && !hasLink) {
            return null;
          }

          return (
            <li key={id} className={cn(ui.item)}>
              {hasChildren ? (
                <SiteNavDropdown
                  href={href || undefined}
                  label={label || undefined}
                  ariaLabel={label || undefined}
                  items={safeChildren}
                  itemContainerClass={ui.interactive}
                  itemLinkClass={ui.link}
                  itemLabelClass={ui.label}
                  panelClass={ui.dropdownPanel}
                />
              ) : (
                <SiteNavLink
                  href={href}
                  label={label || href}
                  ariaLabel={label || undefined}
                  newTab={Boolean(item.newTab)}
                  className={cn(ui.interactive)}
                  linkClassName={cn(ui.link)}
                  labelClassName={cn(ui.label)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </SiteNavActiveSectionProvider>
  );
}

SitePrimaryMenu.displayName = "SitePrimaryMenu";
