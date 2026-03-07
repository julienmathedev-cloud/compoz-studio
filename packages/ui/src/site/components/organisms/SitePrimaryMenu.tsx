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
 * - La clé de liste est stabilisée via `toStableUiKey`.
 * - Le style est fourni par le skin/template via `ui`.
 */

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { SiteNavLink } from "@compoz/ui/site/components/atoms/SiteNavLink";
import { SiteNavDropdown } from "@compoz/ui/site/components/molecules/SiteNavDropdown";
import type { SitePrimaryMenuUi } from "@compoz/ui/site/site-ui.types.ts";
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
  const items = Array.isArray(settings?.items) ? settings.items : [];
  if (items.length === 0) return null;

  return (
    <ul className={cn(ui.list)}>
      {items.map((item, index) => {
        const href = item.href?.trim() ?? "";
        const label = item.label?.trim() ?? "";

        const children = Array.isArray(item.children) ? item.children : [];
        const safeChildren = children.filter((c) => {
          const childHref = c.href?.trim() ?? "";
          const childLabel = c.label?.trim() ?? "";
          return Boolean(childHref && childLabel);
        });

        const hasChildren = safeChildren.length > 0;
        const hasLink = Boolean(href);

        // Rien d’exploitable : on ne rend pas l’item.
        if (!hasChildren && !hasLink) return null;

        return (
          <li
            key={toStableUiKey({ href, label }, index)}
            className={cn(ui.item)}
          >
            {hasChildren ? (
              <SiteNavDropdown
                // href vide possible : le dropdown forcera un <button> (cf. ta logique interne)
                href={href || undefined}
                label={label || undefined}
                ariaLabel={label || undefined}
                items={safeChildren}
                blurClassName={blurClassName}
                ui={{
                  itemContainer: cn(ui.interactive),
                  itemLink: cn(ui.link),
                  panel: cn(ui.dropdownPanel),
                }}
              />
            ) : (
              <SiteNavLink
                href={href}
                label={label || href}
                ariaLabel={label || undefined}
                newTab={Boolean(item.newTab)}
                className={cn(ui.interactive)}
                linkClassName={cn(ui.link)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

SitePrimaryMenu.displayName = "SitePrimaryMenu";
