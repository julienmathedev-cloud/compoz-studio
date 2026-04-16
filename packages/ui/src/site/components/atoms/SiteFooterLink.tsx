"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteFooterLink.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : lien texte réutilisable (footer, menu légal, navigation secondaire).
 *
 * @remarks
 * - Interne : rendu via `next/link`.
 * - Externe : rendu via `<a>`.
 * - Supporte `mailto:` / `tel:`.
 * - Sécurise les liens externes (`target`/`rel`) et neutralise les `href` non sûrs.
 * - En preview iframe : désactive toute navigation.
 * - Convention V0.5 : plus de querystring `state` (draft/published via routes dédiées).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  resolveInternalHref,
  resolveLinkFlags,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

export type SiteFooterLinkProps = Readonly<{
  label: string;
  href: string;
  newTab?: boolean;
  ariaLabel?: string;
  showNewTabHint?: boolean;
  newTabHintSrLabel?: string;
  className?: string;
  linkClassName?: string;
}>;

export function SiteFooterLink({
  label,
  href,
  newTab,
  ariaLabel,
  showNewTabHint = true,
  newTabHintSrLabel = " (ouvre dans un nouvel onglet)",
  className,
  linkClassName,
}: SiteFooterLinkProps) {
  const pathname = usePathname() || "/";

  const normalizedHref = normalizeString(href);
  const normalizedLabel = normalizeString(label);

  if (!normalizedHref || !normalizedLabel) {
    return null;
  }

  const disableAllLinks = shouldDisableLinksInPreview(pathname);
  const { special, external, rawExternal, unsafe } =
    resolveLinkFlags(normalizedHref);

  const shouldNewTab = Boolean(newTab) && external && !special;
  const target = shouldNewTab ? "_blank" : undefined;
  const rel = shouldNewTab ? "noopener noreferrer external" : undefined;

  const content = (
    <>
      {normalizedLabel}
      {showNewTabHint && rawExternal && !special ? (
        <span className="sr-only">{newTabHintSrLabel}</span>
      ) : null}
    </>
  );

  const disabledContent = (
    <span
      className={cn(linkClassName)}
      aria-disabled="true"
      data-disabled="true"
      tabIndex={-1}
    >
      {content}
    </span>
  );

  if (unsafe) {
    return disabledContent;
  }

  if (disableAllLinks) {
    return (
      <div className={cn(className, "cursor-pointer")}>{disabledContent}</div>
    );
  }

  if (rawExternal) {
    return (
      <div className={cn(className)}>
        <a
          href={normalizedHref}
          aria-label={ariaLabel}
          className={cn(linkClassName)}
          target={target}
          rel={rel}
          data-external={!special ? true : undefined}
        >
          {content}
        </a>
      </div>
    );
  }

  const internalHref = resolveInternalHref(pathname, normalizedHref);

  return (
    <div className={cn(className)}>
      <Link
        href={internalHref}
        aria-label={ariaLabel}
        className={cn(linkClassName)}
        scroll={false}
      >
        {content}
      </Link>
    </div>
  );
}

SiteFooterLink.displayName = "SiteFooterLink";
