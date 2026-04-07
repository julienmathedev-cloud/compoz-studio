/**
 * @file packages/ui/src/site/components/molecules/SiteLegalMenu.tsx
 * @layer ui/site/components
 *
 * @description
 * Molecule site : menu légal (liste de liens) rendu depuis `LegalMenuSettingsShape`.
 *
 * @remarks
 * - Rend `null` si aucun item n’est disponible.
 * - Délègue le rendu du lien à `SiteFooterLink` (garde-fous href + a11y).
 * - Les clés de liste utilisent désormais l’identifiant métier stable `id`.
 * - Le style est fourni par le skin/template via `ui`.
 */

import { cn } from "@compoz/ui/lib/utils";
import { SiteFooterLink } from "@compoz/ui/site/components/atoms/SiteFooterLink";
import type { SiteLegalMenuUi } from "@compoz/ui/site/site-ui.types";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

export type SiteLegalMenuProps = Readonly<{
  /** Settings du menu légal (shape site). */
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
