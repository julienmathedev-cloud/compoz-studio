/**
 * @file packages/ui/src/renderer/cells/CarouselCellRenderer.tsx
 * @layer ui/public/cells
 *
 * @description
 * Cell renderer public/preview : rendu d’un carrousel d’images (V0.5).
 *
 * @remarks
 * - ✅ Le style vient du skin via `ui`.
 * - ✅ Le composant PublicCarousel ne possède aucun style par défaut.
 */
import { normalizeString } from "@compoz/ui/lib/normalize";
import type { PublicImage } from "@compoz/ui/site/components/atoms/PublicAppImage";
import { PublicCarousel } from "@compoz/ui/site/components/organisms/PublicCarousel";
import type { PublicCarouselUi } from "@compoz/ui/site/public-ui.types";
import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CarouselCellRendererProps = Readonly<{
  images?: ReadonlyArray<ImageEditorShape> | null;
  ui: PublicCarouselUi;
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

  const items: PublicImage[] = normalized.map((img) => ({
    src: img.src,
    alt: img.alt,
  }));

  const containerClassName = isFullBleed ? ui.containerFill : ui.containerRatio;

  return (
    <PublicCarousel
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
    id: normalizeString(img.id, ""),
    src: normalizeString(img.src, ""),
    alt: normalizeString(img.alt, ""),
    caption: typeof img.caption === "string" ? img.caption.trim() : undefined,
  } as const;
}
