/**
 * @file packages/ui/src/site/components/molecules/SiteDetailPager.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders previous and next navigation links for public detail pages.
 *
 * @remarks
 * Returns nothing when neither link is available; links are delegated to `SiteNavLink` for preview blocking and href guardrails.
 */

import { ArrowLeft, ArrowRight } from "lucide-react";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteNavLink } from "@compoz/ui/site/components/atoms/SiteNavLink";
import type { SiteDetailPagerUi } from "@compoz/ui/site/site-ui.types";

export type SiteDetailPagerLink = Readonly<{
  href: string;
  label: string;
  ariaLabel?: string;
}>;

export type SiteDetailPagerProps = Readonly<{
  prev?: SiteDetailPagerLink | null;
  next?: SiteDetailPagerLink | null;
  className?: string;
  ariaLabel?: string;
  ui: SiteDetailPagerUi;
}>;

export function SiteDetailPager({
  prev,
  next,
  className,
  ariaLabel = "Navigation entre les pages",
  ui,
}: SiteDetailPagerProps) {
  const hasPrev = Boolean(prev?.href && prev?.label);
  const hasNext = Boolean(next?.href && next?.label);

  if (!hasPrev && !hasNext) return null;

  const prevLabel = normalizeString(prev?.label);
  const nextLabel = normalizeString(next?.label);

  const prevAria =
    normalizeString(prev?.ariaLabel) ||
    (prevLabel ? `Page précédente : ${prevLabel}` : "Page précédente");

  const nextAria =
    normalizeString(next?.ariaLabel) ||
    (nextLabel ? `Page suivante : ${nextLabel}` : "Page suivante");

  return (
    <nav aria-label={ariaLabel} className={cn(ui.nav, className)}>
      {hasPrev ? (
        <SiteNavLink
          href={prev!.href}
          ariaLabel={prevAria}
          linkClassName={cn(ui.link)}
          labelClassName={cn(ui.wrapper)}
        >
          <ArrowLeft aria-hidden="true" className={cn(ui.icon)} />
          <span className={cn(ui.label)}>{prevLabel}</span>
        </SiteNavLink>
      ) : (
        // Preserve layout alignment when only the next link is available.
        <span aria-hidden="true" />
      )}

      {hasNext ? (
        <SiteNavLink
          href={next!.href}
          ariaLabel={nextAria}
          linkClassName={cn(ui.link)}
          labelClassName={cn(ui.wrapper)}
        >
          <span className={cn(ui.label)}>{nextLabel}</span>
          <ArrowRight aria-hidden="true" className={cn(ui.icon)} />
        </SiteNavLink>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}

SiteDetailPager.displayName = "SiteDetailPager";
