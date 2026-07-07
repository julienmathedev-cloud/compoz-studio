/**
 * @file packages/ui/src/renderer/cells/ImageCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated zoomable image cell.
 *
 * @remarks
 * Delegates image accessibility, performance, and lightbox behavior to `SiteZoomableImage`; captions are rendered as a `figure` when present.
 */

import type { ImageCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteZoomableImage } from "@compoz/ui/site/components/molecules/SiteZoomableImage";
import type {
  SiteImageUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";

export type ImageCellRendererProps = Readonly<{
  cell?: ImageCellShape | null;
  ui: SiteImageUi;
  revealUi: SiteRevealPresetUi;
  priority?: boolean;
}>;

export function ImageCellRenderer({
  cell,
  ui,
  revealUi,
  priority,
}: ImageCellRendererProps) {
  if (!cell?.image) return null;

  const src = normalizeString(cell.image.src, "");
  const alt = normalizeString(cell.image.alt, "");
  const caption = normalizeString(cell.image.caption, "");

  if (!src) return null;

  const variant = cell.variant ?? "default";
  const size = cell.size ?? "full";

  const mode = ui.variantMode[variant];
  const frameClass = ui.variantFrame[variant];
  const resolvedSizes = ui.variantSizes[variant];
  const reveal = cell.reveal === true;

  const imageNode = (
    <SiteZoomableImage
      image={{
        src,
        alt,
        width: cell.image.width,
        height: cell.image.height,
      }}
      caption={caption || undefined}
      zoomable={cell.zoomEnabled}
      sizes={resolvedSizes}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      buttonClassName={cn(ui.button)}
      imageClassName={cn(
        ui.image,
        mode === "default" ? ui.imageDefault : ui.imageCover,
      )}
      lightboxUi={ui.lightbox}
    />
  );

  const visual = (
    <div
      className={cn(ui.root)}
      data-image-root
      data-image-variant={variant}
      data-image-size={size}
      data-image-mode={mode}
      data-image-zoomable={cell.zoomEnabled ? "true" : "false"}
    >
      <div className={cn(ui.size[size])} data-image-size-wrapper>
        <div
          className={cn(mode !== "default" && frameClass, ui.container)}
          data-image-container
          data-image-framed={mode !== "default" ? "true" : "false"}
        >
          {imageNode}
        </div>
      </div>
    </div>
  );

  const content = caption ? (
    <figure className={cn(ui.figure)} data-image-figure>
      {visual}
      <figcaption className={cn(ui.caption)} data-image-caption>
        {caption}
      </figcaption>
    </figure>
  ) : (
    visual
  );

  return (
    <div
      data-cell="image"
      data-image-cell
      data-image-variant={variant}
      data-image-size={size}
      data-image-mode={mode}
      data-image-has-caption={caption ? "true" : "false"}
      data-reveal={reveal ? "true" : "false"}
    >
      {reveal ? (
        <SiteReveal revealUi={revealUi}>{content}</SiteReveal>
      ) : (
        content
      )}
    </div>
  );
}

ImageCellRenderer.displayName = "ImageCellRenderer";
