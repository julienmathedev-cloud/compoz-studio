/**
 * @file packages/ui/src/site/components/molecules/SiteLegalMenu.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders the public site legal menu from legal menu settings.
 *
 * @remarks
 * Returns nothing when no legal item is available; link rendering is delegated to `SiteFooterLink` for href guardrails and accessibility behavior.
 */

import { cn } from "@compoz/ui/lib/utils";
import { SiteFooterLink } from "@compoz/ui/site/components/atoms/SiteFooterLink";
import type { SiteLegalMenuUi } from "@compoz/ui/site/site-ui.types";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

export type SiteLegalMenuProps = Readonly<{
  legalMenu: LegalMenuSettingsShape;

  ui: SiteLegalMenuUi;
}>;

export function SiteLegalMenu({ legalMenu, ui }: SiteLegalMenuProps) {
  const items = Array.isArray(legalMenu?.items) ? legalMenu.items : [];
  if (items.length === 0) return null;

  return (
    <nav aria-label="Mentions légales" className={cn(ui.nav)}>
      <ul className={cn(ui.list)}>
        {items.map((it) => {
          const id = it.id;
          const label = it.label;
          const href = it.href;

          return (
            <li key={id} className={cn(ui.item)}>
              <SiteFooterLink
                label={label}
                href={href}
                newTab={Boolean(it.newTab)}
                className={cn(ui.interactive)}
                linkClassName={cn(ui.link)}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

SiteLegalMenu.displayName = "SiteLegalMenu";
