/**
 * @file packages/ui/src/site/components/layouts/SiteFooter.tsx
 * @layer ui/site/components/layouts
 *
 * @description
 * Renders the public site footer with powered-by, copyright, and legal navigation surfaces.
 *
 * @remarks
 * Returns nothing when no footer content is renderable; legal links are delegated to `SiteLegalMenu`.
 */

import Link from "next/link";

import { normalizeArray, normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteLegalMenu } from "@compoz/ui/site/components/molecules/SiteLegalMenu";
import type { SiteFooterUi } from "@compoz/ui/site/site-ui.types";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

export type SiteFooterProps = Readonly<{
  footer: FooterSettingsShape;
  legalMenu: LegalMenuSettingsShape;
  ui: SiteFooterUi;
}>;

export function SiteFooter({ footer, legalMenu, ui }: SiteFooterProps) {
  const showYear = Boolean(footer?.showYear);
  const rawCopyright = normalizeString(footer?.copyright);
  const links = normalizeArray(legalMenu?.items);

  const hasLinks = links.length > 0;
  const hasCopyrightLine = showYear || Boolean(rawCopyright);
  const hasPoweredBy = true;

  if (!hasPoweredBy && !hasCopyrightLine && !hasLinks) {
    return null;
  }

  const year = showYear ? new Date().getFullYear() : null;

  return (
    <footer className={cn(ui.footer)} aria-label="Pied de page">
      <div className={cn(ui.footerContainer)}>
        {hasPoweredBy ? (
          <div className={cn(ui.poweredBy)}>
            Conçus par{" "}
            <Link
              href="https://julienmathe.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(ui.poweredByLink)}
            >
              Julien Mathé
            </Link>
          </div>
        ) : null}

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

        <SiteLegalMenu legalMenu={legalMenu} ui={ui.legalMenu} />
      </div>
    </footer>
  );
}

SiteFooter.displayName = "SiteFooter";
