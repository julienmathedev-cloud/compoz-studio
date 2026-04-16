"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteTextLink.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : lien texte générique (interne/externe/spécial) avec garde-fous A11y.
 *
 * @remarks
 * - Interne : rendu via `next/link`.
 * - Externe : rendu via `<a>`.
 * - Supporte `mailto:` / `tel:`.
 * - Sécurise les liens externes (`target`/`rel`) et neutralise les `href` non sûrs.
 * - Gère le style via `className` (wrapper) et `linkClassName` (lien) fournis par le skin/template.
 * - Convention V0.5 : plus de querystring `state` (draft/published via routes dédiées).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { getAriaLabel } from "@compoz/ui/lib/a11y/helpers";
import {
  resolveInternalHref,
  resolveLinkFlags,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

const DEFAULT_NEW_TAB_HINT = " (ouvre dans un nouvel onglet)";
const DEFAULT_EXTERNAL_TARGET = "_blank" as const;
const DEFAULT_EXTERNAL_REL = "noopener noreferrer external";

export type SiteTextLinkProps = Readonly<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
    href: string;
    children?: ReactNode;
    label?: string;
    ariaLabel?: string;
    newTab?: boolean;
    prefetch?: boolean;
    className?: string;
    linkClassName?: string;
  }
>;

export function SiteTextLink({
  href,
  children,
  label,
  ariaLabel,
  newTab = false,
  prefetch = false,
  className,
  linkClassName,
  ...rest
}: SiteTextLinkProps) {
  const pathname = usePathname() || "/";
  const normalizedHref = normalizeString(href);
  const textNode: ReactNode = children ?? label ?? normalizedHref;

  if (!normalizedHref) {
    return null;
  }

  const disableAllLinks = shouldDisableLinksInPreview(pathname);
  const { special, external, rawExternal, unsafe } =
    resolveLinkFlags(normalizedHref);

  const fallback = normalizeString(label) || normalizedHref;
  const computedAria = getAriaLabel(ariaLabel, textNode, fallback);

  const shouldOpenNewTab = Boolean(newTab) && external && !special;
  const target = shouldOpenNewTab ? DEFAULT_EXTERNAL_TARGET : undefined;
  const rel = shouldOpenNewTab ? DEFAULT_EXTERNAL_REL : undefined;

  const content = (
    <>
      {textNode}
      {shouldOpenNewTab ? (
        <span className="sr-only">{DEFAULT_NEW_TAB_HINT}</span>
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

  if (unsafe) {
    return <span className={cn(className)}>{disabledContent}</span>;
  }

  if (disableAllLinks) {
    return (
      <span className={cn(className, "cursor-pointer")}>{disabledContent}</span>
    );
  }

  if (rawExternal) {
    const dataExternal = special ? undefined : true;

    return (
      <span className={cn(className)}>
        <a
          href={normalizedHref}
          aria-label={computedAria}
          className={cn(linkClassName)}
          target={target}
          rel={rel}
          data-external={dataExternal}
          {...rest}
        >
          {content}
        </a>
      </span>
    );
  }

  const internalHref = resolveInternalHref(pathname, normalizedHref);

  return (
    <span className={cn(className)}>
      <Link
        href={internalHref}
        aria-label={computedAria}
        className={cn(linkClassName)}
        prefetch={prefetch}
        scroll={false}
        {...(rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}
      >
        {content}
      </Link>
    </span>
  );
}

SiteTextLink.displayName = "SiteTextLink";
