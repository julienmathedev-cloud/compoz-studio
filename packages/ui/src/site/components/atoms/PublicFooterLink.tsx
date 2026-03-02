"use client";

/**
 * @file packages/ui/src/site/components/atoms/PublicFooterLink.tsx
 * @layer ui/public/atoms
 *
 * @description
 * Atome public : lien texte réutilisable (footer, menu légal, navigation secondaire).
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

export type PublicFooterLinkProps = Readonly<{
  label: string;
  href: string;

  /** Ouvre dans un nouvel onglet (uniquement si externe et non spécial). */
  newTab?: boolean;

  /** Nom accessible si le libellé est ambigu (optionnel). */
  ariaLabel?: string;

  /**
   * Ajoute un hint SR-only “(ouvre dans un nouvel onglet)” sur les liens externes.
   * @default true
   */
  showNewTabHint?: boolean;

  /**
   * Libellé SR-only pour indiquer l’ouverture dans un nouvel onglet.
   * @default " (ouvre dans un nouvel onglet)"
   */
  newTabHintSrLabel?: string;

  /** Classes appliquées par le skin/template (wrapper). */
  className?: string;

  /** Classes injectées par skin/template. */
  linkClassName?: string;
}>;

export function PublicFooterLink({
  label,
  href,
  newTab,
  ariaLabel,
  showNewTabHint = true,
  newTabHintSrLabel = " (ouvre dans un nouvel onglet)",
  className,
  linkClassName,
}: PublicFooterLinkProps) {
  const normalizedHref = normalizeString(href);
  const normalizedLabel = normalizeString(label);
  const pathname = usePathname() || "/";

  // Invariants (UI).
  if (!normalizedHref || !normalizedLabel) return null;

  // ✅ Preview : on neutralise toutes les navigations.
  const disableAllLinks = shouldDisableLinksInPreview(pathname);

  // Détection : externe / spécial / unsafe.
  const { special, external, rawExternal, unsafe } =
    resolveLinkFlags(normalizedHref);

  // Href non sûr : lien neutralisé.
  if (unsafe) {
    return (
      <span
        className={cn(linkClassName)}
        aria-disabled="true"
        data-disabled="true"
        tabIndex={-1}
      >
        {label}
      </span>
    );
  }

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

  if (disableAllLinks) {
    return (
      <div className={cn(className, "cursor-pointer")}>
        <span
          className={cn(linkClassName)}
          aria-disabled="true"
          data-disabled="true"
        >
          {content}
        </span>
      </div>
    );
  }

  // Externe (http(s) / mailto / tel).
  if (rawExternal) {
    return (
      <div className={cn(className, "cursor-pointer")}>
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

  // Interne.
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

PublicFooterLink.displayName = "PublicFooterLink";
