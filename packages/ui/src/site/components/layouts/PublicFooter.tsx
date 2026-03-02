"use client";

/**
 * @file packages/ui/src/site/components/layouts/PublicFooter.tsx
 * @layer ui/public/layouts
 *
 * @description
 * Footer public : copyright (année optionnelle) + navigation secondaire (menu légal).
 *
 * @remarks
 * - Rend `null` si aucune information n’est affichable (ni copyright, ni liens).
 * - Les items du menu légal sont normalisés via `normalizeArray`.
 * - Le style est fourni par le skin/template via `ui`.
 *
 * @accessibility
 * - Le footer porte un `aria-label` (landmark explicite).
 * - Les liens légaux sont rendus via `PublicLegalMenu` (qui délègue à `PublicNavLink`).
 */

import { useMemo } from "react";

import { normalizeArray, normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import { PublicLegalMenu } from "@compoz/ui/site/components/molecules/PublicLegalMenu";
import type { PublicFooterUi } from "@compoz/ui/site/public-ui.types";

export type PublicFooterProps = Readonly<{
  footer: FooterSettingsShape;
  legalMenu: LegalMenuSettingsShape;

  /** Optionnel : classes UI injectées par le skin/template. */
  ui: PublicFooterUi;
}>;

export function PublicFooter({ footer, legalMenu, ui }: PublicFooterProps) {
  const showYear = Boolean(footer?.showYear);
  const rawCopyright = normalizeString(footer?.copyright);

  const year = useMemo(() => new Date().getFullYear(), []);
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
                © Copyright {year} - {rawCopyright}
              </>
            ) : showYear ? (
              <>© Copyright {year}</>
            ) : (
              <> © Copyright {rawCopyright}</>
            )}
          </div>
        ) : null}

        {/* Navigation secondaire (optionnelle) */}
        <PublicLegalMenu legalMenu={legalMenu} ui={ui.legalMenu} />
      </div>
    </footer>
  );
}

PublicFooter.displayName = "PublicFooter";
