"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteButton.tsx
 * @layer ui/site/atoms
 *
 * @description
 * Bouton/lien public du site basé sur le composant Button shared.
 *
 * @remarks
 * - Utilise `Button` ShadCN via `asChild` quand il s’agit d’un vrai lien.
 * - Reflète la shape métier d’un item de bouton : `label`, `href`, `variant`.
 * - Réutilise la même logique de résolution que les autres liens publics.
 * - Neutralise les liens unsafe.
 * - En preview iframe : désactive les navigations non-ancre sans casser le rendu visuel.
 * - Si `href` est vide : rend un bouton visuel non cliquable, sans style disabled.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@compoz/ui/components/ui/button";
import {
  resolveInternalHref,
  resolveLinkFlags,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

type SiteButtonVariant = "default" | "secondary" | "outline" | "ghost";

export type SiteButtonProps = Readonly<{
  label: string;
  href: string;
  variant?: SiteButtonVariant;
  className?: string;
}>;

export function SiteButton({
  label,
  href,
  variant = "default",
  className,
}: SiteButtonProps) {
  const pathname = usePathname() || "/";

  const normalizedLabel = normalizeString(label);
  const normalizedHref = normalizeString(href);

  if (!normalizedLabel) return null;

  // ✅ Pas encore de href en phase de construction :
  // on garde le rendu visuel du bouton, sans navigation.
  if (!normalizedHref) {
    return (
      <Button
        type="button"
        variant={variant}
        className={cn(className)}
        aria-disabled="true"
        data-disabled="true"
      >
        {normalizedLabel}
      </Button>
    );
  }

  const disableAllLinks = shouldDisableLinksInPreview(pathname);
  const { special, external, rawExternal, unsafe } =
    resolveLinkFlags(normalizedHref);

  const isHashAnchor = normalizedHref.startsWith("#");

  // CTA externe : nouvel onglet automatique
  const shouldOpenNewTab = external && !special;
  const target = shouldOpenNewTab ? "_blank" : undefined;
  const rel = shouldOpenNewTab ? "noopener noreferrer external" : undefined;

  // Lien non sûr : rendu neutralisé mais visuel conservé
  if (unsafe) {
    return (
      <Button
        type="button"
        variant={variant}
        className={cn(className)}
        aria-disabled="true"
        data-disabled="true"
      >
        {normalizedLabel}
      </Button>
    );
  }

  // ✅ Preview :
  // - on laisse les ancres fonctionner
  // - on neutralise les autres navigations sans style disabled
  if (disableAllLinks && !isHashAnchor) {
    return (
      <Button
        type="button"
        variant={variant}
        className={cn(className)}
        aria-disabled="true"
        data-disabled="true"
      >
        {normalizedLabel}
      </Button>
    );
  }

  // Externe + spécial (http(s), mailto, tel)
  if (rawExternal || isHashAnchor) {
    return (
      <Button asChild variant={variant} className={cn(className)}>
        <a
          href={normalizedHref}
          target={!isHashAnchor ? target : undefined}
          rel={!isHashAnchor ? rel : undefined}
          data-external={!special && !isHashAnchor ? true : undefined}
        >
          {normalizedLabel}
        </a>
      </Button>
    );
  }

  // Interne
  const internalHref = resolveInternalHref(pathname, normalizedHref);

  return (
    <Button asChild variant={variant} className={cn(className)}>
      <Link href={internalHref} scroll={false}>
        {normalizedLabel}
      </Link>
    </Button>
  );
}

SiteButton.displayName = "SiteButton";
