"use client";

/**
 * @file packages/ui/src/site/components/organisms/PublicPrimaryMenu.tsx
 * @layer ui/public/organisms
 *
 * @description
 * Organism public : menu principal (niveau racine + sous-items via dropdown).
 *
 * @remarks
 * - Rend `null` si la liste d’items est vide.
 * - Les liens simples sont rendus via `PublicNavLink`.
 * - Les items avec enfants sont rendus via `PublicNavDropdown`.
 * - La clé de liste est stabilisée via `toStableUiKey`.
 * - Le style est fourni par le skin/template via `ui`.
 */

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { PublicNavLink } from "@compoz/ui/site/components/atoms/PublicNavLink";
import { PublicNavDropdown } from "@compoz/ui/site/components/molecules/PublicNavDropdown";
import type { PublicPrimaryMenuUi } from "@compoz/ui/site/public-ui.types";

export type PublicPrimaryMenuProps = Readonly<{
  /** Settings du menu principal (shape preview/public). */
  settings: PrimaryMenuSettingsShape;

  /** Active le blur sur le menu (V0.5). */
  blurClassName?: string;

  /** Optionnel : classes UI injectées par le skin/template. */
  ui: PublicPrimaryMenuUi;
}>;

/**
 * Menu principal public (UI).
 */
export function PublicPrimaryMenu({
  settings,
  blurClassName,
  ui,
}: PublicPrimaryMenuProps) {
  const items = Array.isArray(settings.items) ? settings.items : [];
  if (items.length === 0) return null;

  return (
    <ul className={cn(ui.list)}>
      {items.map((item, index) => {
        const children = Array.isArray(item.children) ? item.children : [];
        const href = item.href?.trim();
        return (
          <li
            key={toStableUiKey({ href: item.href, label: item.label }, index)}
            className={cn(ui.item)}
          >
            {children.length > 0 ? (
              <PublicNavDropdown
                href={href}
                label={item.label}
                ariaLabel={item.label}
                items={children}
                blurClassName={blurClassName}
                ui={{
                  itemContainer: cn(ui.interactive),
                  panel: cn(ui.dropdownPanel),
                  itemLink: cn(ui.link),
                }}
              />
            ) : href ? (
              <PublicNavLink
                href={href}
                label={item.label}
                ariaLabel={item.label}
                newTab={Boolean(item.newTab)}
                className={cn(ui.interactive)}
                linkClassName={cn(ui.link)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

PublicPrimaryMenu.displayName = "PublicPrimaryMenu";
