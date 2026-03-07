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
  if (!src) return null;

  const variant = cell.variant ?? "default";
  const { frameClass, sizes, mode } = resolveImageVariant(variant);

  const imageNode = (
    <SiteAppImage
      image={{
        src,
        alt,
        width: cell.image.width,
        height: cell.image.height,
      }}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      className={cn(
        ui.image,
        mode === "default" ? ui.imageDefault : ui.imageCover,
      )}
    />
  );

  const content =
    mode === "default" ? (
      imageNode
    ) : (
      <div className={cn(frameClass, ui.container)}>{imageNode}</div>
    );

  return <SiteReveal>{content}</SiteReveal>;
}

ImageCellRenderer.displayName = "ImageCellRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

type ResolvedImageVariant = Readonly<{
  mode: "default" | "cover";
  frameClass: string;
  sizes: string;
}>;

function resolveImageVariant(variant: unknown): ResolvedImageVariant {
  const v = typeof variant === "string" ? variant : "default";

  switch (v) {
    case "wide":
      return {
        mode: "cover",
        frameClass: "w-full aspect-[16/9]",
        sizes: "(max-width: 1024px) 100vw, 1024px",
      };

    case "square":
      return {
        mode: "cover",
        frameClass: "w-full aspect-square",
        sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
      };

    case "portrait":
      return {
        mode: "cover",
        frameClass: "w-full aspect-[4/5]",
        sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
      };

    default:
      return {
        mode: "default",
        frameClass: "",
        sizes: "(max-width: 1024px) 100vw, 1024px",
      };
  }
}
