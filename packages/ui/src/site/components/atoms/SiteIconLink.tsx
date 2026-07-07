/**
 * @file packages/ui/src/site/components/atoms/SiteIconLink.tsx
 * @layer ui/site/components/atoms
 *
 * @description
 * Renders an icon-only public site link with accessible naming and href guardrails.
 *
 * @remarks
 * Unsafe and empty links are neutralized; external links can open in a new tab with secure rel attributes and an optional screen-reader hint.
 */

import type { ReactNode } from "react";

import { getAriaLabel } from "@compoz/ui/lib/a11y/helpers";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

export type SiteIconLinkProps = Readonly<{
  href: string;

  ariaLabel?: string;

  icon: ReactNode;

  className?: string;

  linkClassName?: string;

  newTab?: boolean;

  showNewTabHint?: boolean;

  newTabHintSrLabel?: string;

  externalRel?: string;
}>;

function fallbackFromHref(href: string): string {
  // Prefer the hostname when deriving an accessible fallback label.
  try {
    const u = new URL(href);
    return u.hostname.replace(/^www\./, "");
  } catch {
    if (href.startsWith("mailto:")) return "Email";
    if (href.startsWith("tel:")) return "Téléphone";
    return "Lien";
  }
}

export function SiteIconLink({
  href,
  ariaLabel,
  icon,
  className,
  linkClassName,
  newTab = true,
  showNewTabHint,
  newTabHintSrLabel = "(ouvre dans un nouvel onglet)",
  externalRel = "noopener noreferrer",
}: SiteIconLinkProps) {
  const normalizedHref = normalizeString(href);

  // Icon-only links need an accessible label derived from href when none is provided.
  const fallbackBase = normalizedHref
    ? fallbackFromHref(normalizedHref)
    : "Lien";

  const computedAria = getAriaLabel(
    ariaLabel,
    null, // Icon-only link: no visible text.
    fallbackBase,
  );

  const { special, external, unsafe } = resolveLinkFlags(normalizedHref);

  // Empty or unsafe hrefs remain visually present but non-clickable.
  if (!normalizedHref || unsafe) {
    return (
      <div className={cn(className)}>
        <span
          role="link"
          className={cn(linkClassName)}
          aria-label={computedAria}
          aria-disabled="true"
          data-disabled="true"
          tabIndex={-1}
        >
          <span aria-hidden="true">{icon}</span>
        </span>
      </div>
    );
  }

  const shouldOpenNewTab = Boolean(newTab) && external && !special;
  const target = shouldOpenNewTab ? "_blank" : undefined;
  const rel = shouldOpenNewTab ? externalRel : undefined;

  const shouldHintNewTab = shouldOpenNewTab && (showNewTabHint ?? true);

  return (
    <div className={cn(className)}>
      <a
        href={normalizedHref}
        aria-label={computedAria}
        className={cn(linkClassName)}
        target={target}
        rel={rel}
        data-external={external ? "true" : undefined}
      >
        <span aria-hidden="true">{icon}</span>

        {/* Optional screen-reader hint for new-tab links. */}
        {shouldHintNewTab ? (
          <span className="sr-only"> {newTabHintSrLabel}</span>
        ) : null}
      </a>
    </div>
  );
}

SiteIconLink.displayName = "SiteIconLink";
