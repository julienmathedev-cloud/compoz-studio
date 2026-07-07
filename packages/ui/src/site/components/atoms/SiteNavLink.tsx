"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteNavLink.tsx
 * @layer ui/site/components/atoms
 *
 * @description
 * Renders a robust public site navigation link across internal, external, special, and unsafe hrefs.
 *
 * @remarks
 * Handles active state, accessible labels, preview navigation blocking, secure external links, and neutralized unsafe links.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  forwardRef,
  type AnchorHTMLAttributes,
  type ReactNode,
  useContext,
} from "react";

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

const SiteNavActiveSectionContext = createContext<string | null | undefined>(
  undefined,
);

export type SiteNavActiveSectionProviderProps = Readonly<{
  activeSectionId: string | null;
  children: ReactNode;
}>;

export function SiteNavActiveSectionProvider({
  activeSectionId,
  children,
}: SiteNavActiveSectionProviderProps) {
  return (
    <SiteNavActiveSectionContext.Provider value={activeSectionId}>
      {children}
    </SiteNavActiveSectionContext.Provider>
  );
}

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
    labelClassName?: string;
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
      labelClassName,
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
    const activeSectionId = useContext(SiteNavActiveSectionContext);

    const normalizedHref = normalizeString(href);
    const textNode = children ?? label ?? normalizedHref;

    const disableAllLinks = shouldDisableLinksInPreview(pathname);
    const { special, external, rawExternal, unsafe } =
      resolveLinkFlags(normalizedHref);
    const isHashAnchor = normalizedHref.startsWith("#");
    const hasHashFragment = normalizedHref.includes("#");
    const hashFragment = getHashFragment(normalizedHref);
    const isActiveHashAnchor =
      hashFragment !== null && activeSectionId === hashFragment;

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
        <span className={cn(labelClassName)}>{content}</span>
      </span>
    );

    if (unsafe || !normalizedHref) {
      return <span className={cn(className)}>{disabledContent}</span>;
    }

    if (disableAllLinks && !isHashAnchor) {
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
            <span className={cn(labelClassName)}>{content}</span>
          </a>
        </div>
      );
    }

    if (rawExternal || isHashAnchor) {
      return (
        <div className={cn(className)}>
          <a
            ref={ref}
            href={normalizedHref}
            aria-label={computedAria}
            aria-current={
              isHashAnchor && isActiveHashAnchor ? "page" : undefined
            }
            className={cn(linkClassName)}
            target={!isHashAnchor ? target : undefined}
            rel={!isHashAnchor ? rel : undefined}
            data-external={!isHashAnchor ? "true" : undefined}
            {...rest}
            onClick={onClick}
          >
            <span className={cn(labelClassName)}>{content}</span>
          </a>
        </div>
      );
    }

    const internalHref = resolveInternalHref(pathname, normalizedHref);

    const base = resolveSiteMountBase(pathname);
    const targetPath = normalizePath(internalHref);

    const isHomeOfMount = targetPath === base;
    const mode = isHomeOfMount ? "exact" : activeMode;

    const isPathCurrent = isActiveLink(pathname, targetPath, mode);
    const isCurrent =
      activeSectionId === undefined
        ? isPathCurrent
        : hashFragment !== null
          ? isPathCurrent && activeSectionId === hashFragment
          : isPathCurrent && activeSectionId === null;
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
          scroll={hasHashFragment}
          {...(rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}
          onClick={(event) => {
            if (isExactCurrent && !hasHashFragment) {
              event.preventDefault();
              return;
            }

            onClick?.(event);
          }}
        >
          <span className={cn(labelClassName)}>{content}</span>
        </Link>
      </div>
    );
  },
);

SiteNavLink.displayName = "SiteNavLink";

function getHashFragment(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex < 0) return null;

  const fragment = href.slice(hashIndex + 1);
  if (!fragment) return null;

  try {
    return decodeURIComponent(fragment);
  } catch {
    return null;
  }
}
