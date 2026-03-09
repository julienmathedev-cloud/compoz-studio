/**
 * @file packages/ui/src/site/components/layouts/SiteFooter.tsx
 * @layer ui/site/components
 *
 * @description
 * Footer site : copyright (année optionnelle) + navigation secondaire (menu légal).
 *
 * @remarks
 * - Rend `null` si aucune information n’est affichable (ni copyright, ni liens).
 * - Les items du menu légal sont normalisés via `normalizeArray`.
 * - Le style est fourni par le skin/template via `ui`.
 *
 * @accessibility
 * - Le footer porte un `aria-label` (landmark explicite).
 * - Les liens légaux sont rendus via `SiteLegalMenu` (qui délègue à `SiteNavLink`).
 */

import { normalizeArray, normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

import { SiteLegalMenu } from "@compoz/ui/site/components/molecules/SiteLegalMenu";
import type { SiteFooterUi } from "@compoz/ui/site/site-ui.types";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

export type SiteFooterProps = Readonly<{
  footer: FooterSettingsShape;
  legalMenu: LegalMenuSettingsShape;

  /** Optionnel : classes UI injectées par le skin/template. */
  ui: SiteFooterUi;
}>;

export function SiteFooter({ footer, legalMenu, ui }: SiteFooterProps) {
  const showYear = Boolean(footer?.showYear);
  const rawCopyright = normalizeString(footer?.copyright);

  const year = new Date().getFullYear();
  const links = normalizeArray(legalMenu?.items);

  const hasLinks = links.length > 0;

  const hasCopyrightLine = showYear || Boolean(rawCopyright);
  const hasAnything = hasCopyrightLine || hasLinks;

  if (!hasAnything) return null;

  return (
    <footer className={cn(ui.footer)} aria-label="Pied de page">
      <div className={cn(ui.footerContainer)}>
        {/* Copyright centré */}
        {hasCopyrightLine ? (
          <div className={cn(ui.copyright)}>
            {showYear && rawCopyright ? (
              <>
                © Copyright {year} · {rawCopyright}
              </>
            ) : showYear ? (
              <>© Copyright {year}</>
            ) : (
              <>© Copyright {rawCopyright}</>
            )}
          </div>
        ) : null}

        {/* Navigation secondaire (optionnelle) */}
        <SiteLegalMenu legalMenu={legalMenu} ui={ui.legalMenu} />
      </div>
    </footer>
  );
}

SiteFooter.displayName = "SiteFooter";
