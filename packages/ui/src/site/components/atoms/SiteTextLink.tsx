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
    /** Href (interne ou externe). */
    href: string;

    /** Contenu du lien (prioritaire). */
    children?: ReactNode;

    /** Fallback texte si `children` est absent. */
    label?: string;

    /** Nom accessible optionnel (si icône seule / texte ambigu). */
    ariaLabel?: string;

    /** Ouvre dans un nouvel onglet (uniquement si externe et non spécial). */
    newTab?: boolean;

    /** Prefetch Next.js (liens internes). */
    prefetch?: boolean;

    /** Classes appliquées par le skin/template (wrapper). */
    className?: string;

    /** Classes appliquées au lien (`<a>`/`<Link>`). */
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
  // (1) Normalisation.
  const normalizedHref = normalizeString(href);

  // Texte final : children > label > href.
  const textNode: ReactNode = children ?? label ?? normalizedHref;

  const pathname = usePathname() || "/";

  // Invariants (UI).
  if (!normalizedHref) return null;

  // ✅ Preview : on neutralise toutes les navigations.
  const disableAllLinks = shouldDisableLinksInPreview(pathname);

  // (2) Détection : spécial / externe / unsafe.
  const { special, external, rawExternal, unsafe } =
    resolveLinkFlags(normalizedHref);

  // (3) A11y : nom accessible uniquement si nécessaire.
  const fallback = normalizeString(label) || normalizedHref;
  const computedAria = getAriaLabel(ariaLabel, textNode, fallback);

  // Hint SR (nouvel onglet) : uniquement si lien externe http(s) et ouverture nouvel onglet.
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

  // (4) Unsafe : lien neutralisé.
  if (unsafe) {
    return (
      <span
        className={cn(className)}
        aria-label={computedAria}
        aria-disabled="true"
        data-disabled="true"
        tabIndex={-1}
      >
        {content}
      </span>
    );
  }

  // ✅ Preview : on neutralise TOUTES les navigations (interne + externe + special).
  if (disableAllLinks) {
    return (
      <span
        className={cn(className, "cursor-default")}
        aria-label={computedAria}
        aria-disabled="true"
        data-disabled="true"
      >
        <span className={cn(linkClassName)}>{content}</span>
      </span>
    );
  }

  // (5) Externe (http(s) / mailto / tel) : <a>
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

  // (6) Interne : <Link>
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
