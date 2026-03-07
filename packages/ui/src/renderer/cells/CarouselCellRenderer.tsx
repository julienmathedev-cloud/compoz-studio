/**
 * @file packages/ui/src/renderer/cells/CarouselCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un carrousel d’images (V0.5).
 *
 * @remarks
 * - ✅ Le style vient du skin via `ui`.
 * - ✅ Le composant `SiteCarousel` ne possède aucun style par défaut.
 */

import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import type { SiteImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteCarousel } from "@compoz/ui/site/components/organisms/SiteCarousel";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CarouselCellRendererProps = Readonly<{
  images?: ReadonlyArray<ImageEditorShape> | null;
  ui: SiteCarouselUi;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CarouselCellRenderer({
  images,
  ui,
  isFullBleed = false,
  priority = false,
}: CarouselCellRendererProps) {
  if (!images || images.length === 0) return null;

  const normalized = images
    .map(__normalizeImage)
    .filter((img) => Boolean(img.src));

  if (normalized.length === 0) return null;

  const items: SiteImage[] = normalized.map((img) => ({
    src: img.src,
    alt: img.alt,
  }));

  const containerClassName = isFullBleed ? ui.containerFill : ui.containerRatio;

  return (
    <SiteCarousel
      images={items}
      containerClassName={containerClassName}
      imageClassName={ui.image}
      layout={isFullBleed ? "fill" : "ratio"}
      priority={priority}
    />
  );
}

CarouselCellRenderer.displayName = "CarouselCellRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function __normalizeImage(img: ImageEditorShape) {
  return {
    src: normalizeString(img.src, ""),
    alt: normalizeString(img.alt, ""),
    caption: typeof img.caption === "string" ? img.caption.trim() : undefined,
  } as const;
}
