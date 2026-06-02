"use client";

/**
 * @file packages/ui/src/site/components/organisms/SitePrimaryMenu.tsx
 * @layer ui/site/organisms
 *
 * @description
 * Organism site : menu principal (niveau racine + sous-items via dropdown).
 *
 * @remarks
 * - Rend `null` si la liste d’items est vide.
 * - Les liens simples sont rendus via `SiteNavLink`.
 * - Les items avec enfants sont rendus via `SiteNavDropdown`.
 * - Les clés de liste utilisent désormais l’identifiant métier stable `id`.
 * - Le style est fourni par le skin/template via `ui`.
 */

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { collectSectionIds, useActiveSection } from "@compoz/ui/hooks/useActiveSection";
import { cn } from "@compoz/ui/lib/utils";
import {
  SiteNavActiveSectionProvider,
  SiteNavLink,
} from "@compoz/ui/site/components/atoms/SiteNavLink";
import { SiteNavDropdown } from "@compoz/ui/site/components/molecules/SiteNavDropdown";
import type { SitePrimaryMenuUi } from "@compoz/ui/site/site-ui.types";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

export type SitePrimaryMenuProps = Readonly<{
  /** Settings du menu principal (shape preview/site). */
  settings: PrimaryMenuSettingsShape;

  /** Active le blur sur le menu (V0.5). */
  blurClassName?: string;

  /** Optionnel : classes UI injectées par le skin/template. */
  ui: SitePrimaryMenuUi;
}>;

/**
 * Menu principal public (UI).
 */
export function SitePrimaryMenu({
  settings,
  blurClassName,
  ui,
}: SitePrimaryMenuProps) {
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
                  blurClassName={blurClassName}
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
