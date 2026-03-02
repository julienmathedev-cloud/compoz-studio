"use client";

/**
 * @file packages/ui/src/site/components/molecules/PublicLegalMenu.tsx
 * @layer ui/public/molecules
 *
 * @description
 * Molecule public : menu légal (liste de liens) rendu depuis `LegalMenuSettingsShape`.
 *
 * @remarks
 * - Rend `null` si aucun item n’est disponible.
 * - Délègue le rendu du lien à `PublicFooterLink` (garde-fous href + a11y).
 * - Le style est fourni par le skin/template via `ui`.
 */

import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { PublicFooterLink } from "@compoz/ui/site/components/atoms/PublicFooterLink";
import type { PublicLegalMenuUi } from "@compoz/ui/site/public-ui.types";

export type PublicLegalMenuProps = Readonly<{
  /** Settings du menu légal (shape preview/public). */
  legalMenu: LegalMenuSettingsShape;

  ui: PublicLegalMenuUi;
}>;

export function PublicLegalMenu({ legalMenu, ui }: PublicLegalMenuProps) {
  const items = Array.isArray(legalMenu?.items) ? legalMenu.items : [];
  if (items.length === 0) return null;

  return (
    <nav aria-label="Mentions légales" className={cn(ui.nav)}>
      <ul className={cn(ui.list)}>
        {items.map((it, index) => {
          const label = it.label;
          const href = it.href;

          return (
            <li
              key={toStableUiKey({ href, label }, index)}
              className={cn(ui.item)}
            >
              <PublicFooterLink
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

PublicLegalMenu.displayName = "PublicLegalMenu";
