"use client";

/**
 * @file packages/ui/src/site/components/atoms/PublicNavLink.tsx
 * @layer ui/public/atoms
 *
 * @description
 * Atome public : lien de navigation robuste (interne/externe/spécial/unsafe) avec a11y et garde-fous.
 *
 * @remarks
 * - Interne : rendu via `next/link` + état actif (`aria-current`).
 * - Externe : rendu via `<a>` (option `newTab` + `target/rel`).
 * - Spécial (`mailto:`/`tel:`) : rendu via `<a>` sans `target/rel` externes.
 * - Unsafe : lien neutralisé (rendu non cliquable).
 * - Preview : neutralise toute navigation.
 * - Convention V0.5 : draft/published via routes dédiées (/draft, /site).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, type AnchorHTMLAttributes } from "react";

import { getAriaLabel } from "@compoz/ui/lib/a11y/helpers";
import {
  isActiveLink,
  normalizePath,
  resolveInternalHref,
  resolveLinkFlags,
  resolvePublicMountBase,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

export type PublicNavLinkProps = Readonly<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    label?: string;
    ariaLabel?: string;
    newTab?: boolean;
    prefetch?: boolean;
    showNewTabHint?: boolean;
    newTabHintSrLabel?: string;
    activeMode?: "startsWith" | "exact";
    className?: string;
    linkClassName?: string;
    externalTarget?: "_blank";
    externalRel?: string;
  }
>;

export const PublicNavLink = forwardRef<HTMLAnchorElement, PublicNavLinkProps>(
  function PublicNavLink(
    {
      href,
      label,
      ariaLabel,
      className,
      linkClassName,
      newTab = false,
      prefetch = true,
      showNewTabHint,
      newTabHintSrLabel = " (ouvre dans un nouvel onglet)",
      activeMode = "startsWith",
      externalTarget = "_blank",
      externalRel = "noopener noreferrer",
      children,
      onClick,
      ...rest
    },
    ref,
  ) {
    const normalizedHref = normalizeString(href);
    const textNode = children ?? label ?? normalizedHref;

    const pathname = usePathname() || "/";
    const disableAllLinks = shouldDisableLinksInPreview(pathname);

    const { special, external, rawExternal, unsafe } =
      resolveLinkFlags(normalizedHref);

    // A11y: nom accessible
    const computedAria = getAriaLabel(
      ariaLabel,
      textNode,
      typeof label === "string" ? label : undefined,
    );

    const shouldNewTab = Boolean(newTab) && external && !special;
    const target = shouldNewTab ? externalTarget : undefined;
    const rel = shouldNewTab ? externalRel : undefined;

    const shouldHintNewTab = shouldNewTab && (showNewTabHint ?? true);

    const content = (
      <>
        {textNode}
        {shouldHintNewTab ? (
          <span className="sr-only">{newTabHintSrLabel}</span>
        ) : null}
      </>
    );

    // Unsafe / vide : neutralisé
    if (unsafe || !normalizedHref) {
      return (
        <span
          className={cn(className)}
          aria-disabled="true"
          data-disabled="true"
          tabIndex={-1}
        >
          {content}
        </span>
      );
    }

    // Preview : neutralise tout
    if (disableAllLinks) {
      return (
        <div className={cn(className, "cursor-pointer")}>
          <span
            className={cn(linkClassName)}
            aria-label={computedAria}
            aria-disabled="true"
            data-disabled="true"
          >
            {content}
          </span>
        </div>
      );
    }

    // Spécial: mailto/tel
    if (special) {
      return (
        <div className={cn(className, "cursor-pointer")}>
          <a
            ref={ref}
            href={normalizedHref}
            aria-label={computedAria}
            className={cn(linkClassName)}
            {...rest}
          >
            {content}
          </a>
        </div>
      );
    }

    // Externe http(s)
    if (rawExternal) {
      return (
        <div className={cn(className)}>
          <a
            ref={ref}
            href={normalizedHref}
            aria-label={computedAria}
            className={cn(linkClassName)}
            target={target}
            rel={rel}
            data-external={!special ? true : undefined}
            {...rest}
          >
            {content}
          </a>
        </div>
      );
    }

    // Interne : résout le mount (/site, /draft, /)
    const internalHref = resolveInternalHref(pathname, normalizedHref);

    // Détection actif (paths uniquement)
    const base = resolvePublicMountBase(pathname); // "/site" | "/draft" | "/"
    const targetPath = normalizePath(internalHref); // important

    const isHomeOfMount = targetPath === base;
    const mode = isHomeOfMount ? "exact" : activeMode;

    const isCurrent = isActiveLink(pathname, targetPath, mode);
    const isExactCurrent = isActiveLink(pathname, targetPath, "exact");

    return (
      <div className={cn(className)}>
        <Link
          ref={ref}
          href={internalHref}
          aria-label={computedAria}
          aria-current={isCurrent ? "page" : undefined}
          className={cn(linkClassName)}
          prefetch={prefetch}
          scroll={false}
          {...(rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}
          onClick={(e) => {
            if (isExactCurrent) {
              e.preventDefault();
              return;
            }
            onClick?.(e);
          }}
        >
          {content}
        </Link>
      </div>
    );
  },
);

PublicNavLink.displayName = "PublicNavLink";
