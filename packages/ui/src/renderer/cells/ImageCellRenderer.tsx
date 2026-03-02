/**
 * @file packages/ui/src/renderer/cells/ImageCellRenderer.tsx
 * @layer ui/public/cells
 *
 * @description
 * Cell renderer public/preview : rendu d’une image via `PublicAppImage`.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Délègue A11y + perf à `PublicAppImage`.
 * - Style piloté par le skin via `ui`.
 * - Reveal : activé par défaut (V0.5).
 */
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { PublicAppImage } from "@compoz/ui/site/components/atoms/PublicAppImage";
import { PublicReveal } from "@compoz/ui/site/components/atoms/PublicReveal";
import type { PublicImageUi } from "@compoz/ui/site/public-ui.types";
import type { ImageCellShape } from "@compoz/validation/pages/blocks/cells/cell";

export type ImageCellRendererProps = Readonly<{
  cell?: ImageCellShape | null;
  ui: PublicImageUi;
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

  const Image = (
    <PublicAppImage
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

  const Content =
    mode === "default" ? (
      Image
    ) : (
      <div className={cn(frameClass, ui.container)}>{Image}</div>
    );

  return <PublicReveal>{Content}</PublicReveal>;
}

ImageCellRenderer.displayName = "ImageCellRenderer";

function resolveImageVariant(variant: unknown) {
  const v = typeof variant === "string" ? variant : "default";

  switch (v) {
    case "wide":
      return {
        mode: "cover",
        frameClass: "w-full aspect-[16/9]",
        sizes: "(max-width: 1024px) 100vw, 1024px",
      } as const;

    case "square":
      return {
        mode: "cover",
        frameClass: "w-full aspect-square",
        sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
      } as const;

    case "portrait":
      return {
        mode: "cover",
        frameClass: "w-full aspect-[4/5]",
        sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
      } as const;

    default:
      return {
        mode: "default",
        frameClass: "",
        sizes: "(max-width: 1024px) 100vw, 1024px",
      } as const;
  }
}
