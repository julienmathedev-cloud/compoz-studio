/**
 * @file packages/ui/src/site/components/atoms/SiteIconLink.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : lien “icône seule” (a11y + garde-fous href) avec rendu via `<a>`.
 *
 * @remarks
 * - Icône décorative (`aria-hidden`) ; nom accessible via `aria-label` (fourni ou déduit).
 * - Normalise et qualifie le `href` (special / external / unsafe).
 * - `unsafe` : lien neutralisé (rendu non cliquable).
 * - `external` : `target/rel` optionnels + hint SR “nouvel onglet”.
 * - Le style est piloté par le skin/template (classes).
 */

import type { ReactNode } from "react";

import { getAriaLabel } from "@compoz/ui/lib/a11y/helpers";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

export type SiteIconLinkProps = Readonly<{
  href: string;

  /**
   * Nom accessible explicite (recommandé).
   * Si absent, un fallback lisible est dérivé depuis le `href`.
   */
  ariaLabel?: string;

  /** Icône (ReactNode) — rendue décorative. */
  icon: ReactNode;

  /** Classes appliquées par le skin/template. */
  className?: string;

  /** Classes appliquées au lien (`<a>`). */
  linkClassName?: string;

  /** Ouvre dans un nouvel onglet (par défaut : true). */
  newTab?: boolean;

  /** Ajoute un hint SR “ouvre dans un nouvel onglet” (liens externes). */
  showNewTabHint?: boolean;

  /** Texte SR pour le hint “nouvel onglet”. */
  newTabHintSrLabel?: string;

  /** `rel` externe (si ouverture nouvel onglet). */
  externalRel?: string;
}>;

function fallbackFromHref(href: string): string {
  // Fallback simple : hostname si possible, sinon libellé générique.
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

  // Fallback a11y : nom accessible dérivé du href (icône seule).
  const fallbackBase = normalizedHref
    ? fallbackFromHref(normalizedHref)
    : "Lien";

  const computedAria = getAriaLabel(
    ariaLabel,
    null, // icône seule → pas de texte visible
    fallbackBase,
  );

  const { special, external, unsafe } = resolveLinkFlags(normalizedHref);

  // Unsafe ou href vide : lien neutralisé (non cliquable).
  if (!normalizedHref || unsafe) {
    return (
      <span
        role="link"
        className={cn(className)}
        aria-label={computedAria}
        aria-disabled="true"
        data-disabled="true"
        tabIndex={-1}
      >
        {/* Icône décorative */}
        <span aria-hidden="true">{icon}</span>
      </span>
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
        {/* Icône décorative */}
        <span aria-hidden="true">{icon}</span>

        {/* Hint SR optionnel */}
        {shouldHintNewTab ? (
          <span className="sr-only"> {newTabHintSrLabel}</span>
        ) : null}
      </a>
    </div>
  );
}

SiteIconLink.displayName = "SiteIconLink";
