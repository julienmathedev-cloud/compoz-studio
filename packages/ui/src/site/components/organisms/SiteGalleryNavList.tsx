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
 */

import Link from "next/link";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import type { SiteNavGalleryUi } from "@compoz/ui/site/site-ui.types";
import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteGalleryNavListProps = Readonly<{
  images: ReadonlyArray<ImageEditorShape>;
  ui: SiteNavGalleryUi;
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
  columns,
  priority = false,
  reveal = true,
}: SiteGalleryNavListProps) {
  const cols = clampColumns(columns);
  const resolvedSizes = ui.sizesByColumns[cols];

  return (
    <ul className={cn(ui.list)} data-reveal={reveal ? "true" : "false"}>
      {images.map((img, index) => {
        const normalized = normalizeImage(img);

        if (!normalized.src) {
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
                width: normalized.width,
                height: normalized.height,
              }}
              sizes={resolvedSizes}
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

        const item = href ? (
          <Link href={href} aria-label={ariaLabel} className={cn(ui.link)}>
            {figure}
          </Link>
        ) : (
          figure
        );

        return (
          <li key={normalized.id}>
            {reveal ? (
              <SiteReveal seedOrder={seed} staggerMs={60} amount={0.1}>
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
