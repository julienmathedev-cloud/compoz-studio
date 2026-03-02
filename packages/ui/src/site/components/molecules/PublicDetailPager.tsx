"use client";

/**
 * @file packages/ui/src/site/components/molecules/PublicDetailPager.tsx
 * @layer ui/public/molecules
 *
 * @description
 * Pager précédent/suivant pour pages de détail (public/preview).
 *
 * @remarks
 * - Rend jusqu’à deux liens : « précédent » (gauche) et « suivant » (droite).
 * - Ne rend rien si aucun des deux liens n’est fourni.
 * - Utilise `PublicNavLink` (contentState + neutralisation preview + sécurité href).
 * - Styles 100% skinnables via `ui` (pas de defaults inline).
 */

import { ArrowLeft, ArrowRight } from "lucide-react";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { PublicNavLink } from "@compoz/ui/site/components/atoms/PublicNavLink";
import type { PublicDetailPagerUi } from "@compoz/ui/site/public-ui.types";

export type PublicDetailPagerLink = Readonly<{
  href: string;
  label: string;
  ariaLabel?: string;
}>;

export type PublicDetailPagerProps = Readonly<{
  prev?: PublicDetailPagerLink | null;
  next?: PublicDetailPagerLink | null;
  className?: string;
  ariaLabel?: string;
  ui: PublicDetailPagerUi;
}>;

export function PublicDetailPager({
  prev,
  next,
  className,
  ariaLabel = "Navigation entre les pages",
  ui,
}: PublicDetailPagerProps) {
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
        <PublicNavLink
          href={prev!.href}
          ariaLabel={prevAria}
          linkClassName={cn(ui.link)}
        >
          <ArrowLeft aria-hidden="true" className={cn(ui.icon)} />
          <span className={cn(ui.label)}>{prevLabel}</span>
        </PublicNavLink>
      ) : (
        // Placeholder pour conserver l’alignement “space-between” / grid selon skin
        <span aria-hidden="true" />
      )}

      {hasNext ? (
        <PublicNavLink
          href={next!.href}
          ariaLabel={nextAria}
          linkClassName={cn(ui.link)}
        >
          <span className={cn(ui.label)}>{nextLabel}</span>
          <ArrowRight aria-hidden="true" className={cn(ui.icon)} />
        </PublicNavLink>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}

PublicDetailPager.displayName = "PublicDetailPager";
