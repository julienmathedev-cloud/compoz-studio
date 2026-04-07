/**
 * @file packages/ui/src/renderer/cells/ImageCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une image via `SiteAppImage`.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Délègue A11y + perf à `SiteAppImage`.
 * - Style piloté par le skin via `ui`.
 * - Reveal : activé par défaut (V0.5).
 * - Si une caption est présente, l’image est rendue dans un `figure`
 *   avec `figcaption`.
 */

import type { ImageCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import type { SiteImageUi } from "@compoz/ui/site/site-ui.types";

export type ImageCellRendererProps = Readonly<{
  cell?: ImageCellShape | null;
  ui: SiteImageUi;
  priority?: boolean;
}>;

export function ImageCellRenderer({
  cell,
  ui,
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

  const imageNode = (
    <SiteAppImage
      image={{
        src,
        alt,
        width: cell.image.width,
        height: cell.image.height,
      }}
      sizes={resolvedSizes}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      className={cn(
        ui.image,
        mode === "default" ? ui.imageDefault : ui.imageCover,
      )}
    />
  );

  const visual = (
    <div className={cn(ui.root)}>
      <div className={cn(ui.size[size])}>
        {mode === "default" ? (
          imageNode
        ) : (
          <div className={cn(frameClass, ui.container)}>{imageNode}</div>
        )}
      </div>
    </div>
  );

  const content = caption ? (
    <figure className={cn(ui.figure)}>
      {visual}
      <figcaption className={cn(ui.caption)}>{caption}</figcaption>
    </figure>
  ) : (
    visual
  );

  return cell.reveal ? <SiteReveal>{content}</SiteReveal> : content;
}

ImageCellRenderer.displayName = "ImageCellRenderer";
