"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteGalleryNavList.tsx
 * @branch main
 * @layer ui/site/components
 *
 * @description
 * SiteGalleryNavList : liste d’images avec navigation (si href).
 *
 * @remarks
 * - Style 100% piloté par `ui` (skin).
 * - Le composant conserve uniquement la logique + a11y.
 * - Reveal : activable/désactivable via prop.
 * - Les tailles responsive des images sont pilotées par `ui.sizesByColumns`.
 * - Les liens internes sont résolus relativement au pathname courant.
 * - Les liens externes / spéciaux conservent leur comportement natif.
 * - Les liens unsafe sont neutralisés.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  resolveInternalHref,
  resolveLinkFlags,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import type {
  SiteNavGalleryUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";
import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteGalleryNavListProps = Readonly<{
  images: ReadonlyArray<ImageEditorShape>;
  ui: SiteNavGalleryUi;
  revealUi: SiteRevealPresetUi;
  columns: number;
  priority?: boolean;
  reveal?: boolean;
}>;

type NormalizedImage = Readonly<{
  id: string;
  src: string;
  alt: string;
  caption?: string;
  href?: string;
  width?: number;
  height?: number;
}>;

export function SiteGalleryNavList({
  images,
  ui,
  revealUi,
  columns,
  priority = false,
  reveal = true,
}: SiteGalleryNavListProps) {
  const pathname = usePathname() || "/";
  const cols = clampColumns(columns);
  const thumbWidth = getGalleryThumbnailWidth(cols);

  return (
    <ul className={cn(ui.list)} data-reveal={reveal ? "true" : "false"}>
      {images.map((img, index) => {
        const normalized = normalizeImage(img);

        if (!normalized.src) {
          return null;
        }

        if (!normalized.width || !normalized.height) {
          return null;
        }

        const seed = index % cols;
        const href = normalized.href;
        const ariaLabel = normalized.alt || normalized.caption || "Naviguer";

        const figure = (
          <figure className={cn(ui.figure)}>
            <SiteAppImage
              image={{
                src: normalized.src,
                alt: normalized.alt,
                width: thumbWidth,
                height: getGalleryThumbnailHeight({
                  width: thumbWidth,
                  originalWidth: normalized.width,
                  originalHeight: normalized.height,
                }),
              }}
              className={cn(ui.image)}
              priority={priority && index === 0}
              fetchPriority={priority && index === 0 ? "high" : "auto"}
            />

            {normalized.caption ? (
              <figcaption className={cn(ui.overlayPanel)}>
                <div className={cn(ui.overlayContent)}>
                  {normalized.caption}
                </div>
              </figcaption>
            ) : null}
          </figure>
        );

        let item = figure;

        if (href) {
          const { special, external, rawExternal, unsafe } =
            resolveLinkFlags(href);

          const isHashAnchor = href.startsWith("#");
          const shouldOpenNewTab = external && !special;
          const target = shouldOpenNewTab ? "_blank" : undefined;
          const rel = shouldOpenNewTab
            ? "noopener noreferrer external"
            : undefined;

          if (unsafe) {
            item = (
              <span
                aria-label={ariaLabel}
                className={cn(ui.link)}
                aria-disabled="true"
                data-disabled="true"
              >
                {figure}
              </span>
            );
          } else if (rawExternal || isHashAnchor) {
            item = (
              <a
                href={href}
                aria-label={ariaLabel}
                className={cn(ui.link)}
                target={!isHashAnchor ? target : undefined}
                rel={!isHashAnchor ? rel : undefined}
                data-external={!special && !isHashAnchor ? true : undefined}
              >
                {figure}
              </a>
            );
          } else {
            const internalHref = resolveInternalHref(pathname, href);

            item = (
              <Link
                href={internalHref}
                aria-label={ariaLabel}
                className={cn(ui.link)}
                scroll={false}
              >
                {figure}
              </Link>
            );
          }
        }

        return (
          <li key={normalized.id}>
            {reveal ? (
              <SiteReveal
                revealUi={revealUi}
                seedOrder={seed}
                staggerMs={60}
                amount={0.1}
              >
                {item}
              </SiteReveal>
            ) : (
              item
            )}
          </li>
        );
      })}
    </ul>
  );
}

SiteGalleryNavList.displayName = "SiteGalleryNavList";

function normalizeImage(img: ImageEditorShape): NormalizedImage {
  const caption = normalizeString(
    typeof img.caption === "string" ? img.caption : "",
    "",
  );

  return {
    id: normalizeString(img.id, ""),
    src: normalizeString(img.src, ""),
    alt: normalizeString(img.alt, ""),
    caption: caption || undefined,
    href: normalizeString(img.href, "") || undefined,
    width: img.width,
    height: img.height,
  } as const;
}

function clampColumns(v: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5 || v === 6 ? v : 3;
}

function getGalleryThumbnailWidth(columns: number): number {
  if (columns >= 4) return 384;
  if (columns === 3) return 512;
  if (columns === 2) return 640;

  return 768;
}

function getGalleryThumbnailHeight(params: {
  width: number;
  originalWidth: number;
  originalHeight: number;
}): number {
  if (params.originalWidth <= 0 || params.originalHeight <= 0) {
    return params.width;
  }

  return Math.max(
    1,
    Math.round((params.width * params.originalHeight) / params.originalWidth),
  );
}
