"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteNavLink.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : lien de navigation robuste (interne/externe/spécial/unsafe) avec a11y et garde-fous.
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
  resolveSiteMountBase,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

export type SiteNavLinkProps = Readonly<
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

export const SiteNavLink = forwardRef<HTMLAnchorElement, SiteNavLinkProps>(
  function SiteNavLink(
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
    const pathname = usePathname() || "/";

    const normalizedHref = normalizeString(href);
    const textNode = children ?? label ?? normalizedHref;

    const disableAllLinks = shouldDisableLinksInPreview(pathname);
    const { special, external, rawExternal, unsafe } =
      resolveLinkFlags(normalizedHref);

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

    const disabledContent = (
      <span
        className={cn(linkClassName)}
        aria-label={computedAria}
        aria-disabled="true"
        data-disabled="true"
        tabIndex={-1}
      >
        {content}
      </span>
    );

    if (unsafe || !normalizedHref) {
      return <span className={cn(className)}>{disabledContent}</span>;
    }

    if (disableAllLinks) {
      return (
        <div className={cn(className, "cursor-pointer")}>{disabledContent}</div>
      );
    }

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
            data-external="true"
            {...rest}
          >
            {content}
          </a>
        </div>
      );
    }

    const internalHref = resolveInternalHref(pathname, normalizedHref);

    const base = resolveSiteMountBase(pathname);
    const targetPath = normalizePath(internalHref);

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
          onClick={(event) => {
            if (isExactCurrent) {
              event.preventDefault();
              return;
            }

            onClick?.(event);
          }}
        >
          {content}
        </Link>
      </div>
    );
  },
);

SiteNavLink.displayName = "SiteNavLink";
