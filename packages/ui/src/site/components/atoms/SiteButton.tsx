"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteButton.tsx
 * @layer ui/site/components/atoms
 *
 * @description
 * Renders a public site button or link through the shared Button component.
 *
 * @remarks
 * Unsafe and empty links are rendered as non-clickable visual buttons; Studio preview blocks non-anchor navigation while keeping normal hover styles.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";
import { Button } from "@compoz/ui/components/ui/button";
import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import {
  resolveInternalHref,
  resolveLinkFlags,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import type { SiteButtonUi } from "@compoz/ui/site/site-ui.types";

type SiteButtonVariant = "default" | "secondary" | "outline" | "ghost";
type SiteButtonIconPosition = "before" | "after";

export type SiteButtonProps = Readonly<{
  label: string;
  href: string;
  variant?: SiteButtonVariant;
  icon?: ContentIconKind | null;
  iconPosition?: SiteButtonIconPosition;
  className?: string;
  ui: SiteButtonUi;
}>;

export function SiteButton({
  label,
  href,
  variant = "default",
  icon = null,
  iconPosition = "before",
  className,
  ui,
}: SiteButtonProps) {
  const pathname = usePathname() || "/";

  const normalizedLabel = normalizeString(label);
  const normalizedHref = normalizeString(href);

  if (!normalizedLabel) {
    return null;
  }

  const content = renderButtonContent({
    label: normalizedLabel,
    icon,
    iconPosition,
    ui,
  });

  /** Keep invalid links visually consistent without enabling navigation. */
  const disabledButton = (
    <Button
      type="button"
      variant={variant}
      className={cn(className)}
      aria-disabled="true"
      data-disabled="true"
    >
      {content}
    </Button>
  );

  const disableAllLinks = shouldDisableLinksInPreview(pathname);

  if (!disableAllLinks && !normalizedHref) {
    return disabledButton;
  }

  const { special, external, rawExternal, unsafe } =
    resolveLinkFlags(normalizedHref);

  const isHashAnchor = normalizedHref.startsWith("#");

  const shouldOpenNewTab = external && !special;
  const target = shouldOpenNewTab ? "_blank" : undefined;
  const rel = shouldOpenNewTab ? "noopener noreferrer external" : undefined;

  if (unsafe) {
    return disabledButton;
  }

  /** Studio preview blocks page navigation but keeps anchor links usable. */
  if (disableAllLinks && !isHashAnchor) {
    return (
      <Button asChild variant={variant} className={cn(className)}>
        <a
          href={normalizedHref}
          aria-disabled="true"
          data-preview-disabled="true"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {content}
        </a>
      </Button>
    );
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
          {content}
        </a>
      </Button>
    );
  }

  const internalHref = resolveInternalHref(pathname, normalizedHref);

  return (
    <Button asChild variant={variant} className={cn(className)}>
      <Link href={internalHref} scroll={false}>
        {content}
      </Link>
    </Button>
  );
}

SiteButton.displayName = "SiteButton";

function renderButtonContent({
  label,
  icon,
  iconPosition,
  ui,
}: Readonly<{
  label: string;
  icon: ContentIconKind | null;
  iconPosition: SiteButtonIconPosition;
  ui: SiteButtonUi;
}>): ReactNode {
  if (!icon) {
    return label;
  }

  const iconNode = renderContentIcon(icon, {
    className: cn(ui.icon),
  });

  return (
    <span className={cn(ui.content)}>
      {iconPosition === "before" ? iconNode : null}
      <span className={cn(ui.label)}>{label}</span>
      {iconPosition === "after" ? iconNode : null}
    </span>
  );
}
