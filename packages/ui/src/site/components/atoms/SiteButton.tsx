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

type SiteButtonVariant =
  | "defaultVanilla"
  | "secondaryVanilla"
  | "outlineVanilla"
  | "ghostVanilla";

export type SiteButtonProps = Readonly<{
  label: string;
  href: string;
  variant?: SiteButtonVariant;
  className?: string;
}>;

export function SiteButton({
  label,
  href,
  variant = "defaultVanilla",
  className,
}: SiteButtonProps) {
  const pathname = usePathname() || "/";

  const normalizedLabel = normalizeString(label);
  const normalizedHref = normalizeString(href);

  if (!normalizedLabel) {
    return null;
  }

  const disabledButton = (
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

  if (!normalizedHref) {
    return disabledButton;
  }

  const disableAllLinks = shouldDisableLinksInPreview(pathname);
  const { special, external, rawExternal, unsafe } =
    resolveLinkFlags(normalizedHref);

  const isHashAnchor = normalizedHref.startsWith("#");

  const shouldOpenNewTab = external && !special;
  const target = shouldOpenNewTab ? "_blank" : undefined;
  const rel = shouldOpenNewTab ? "noopener noreferrer external" : undefined;

  if (unsafe) {
    return disabledButton;
  }

  if (disableAllLinks && !isHashAnchor) {
    return disabledButton;
  }

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
