/**
 * @file packages/ui/src/site/components/organisms/PublicGalleryNavList.tsx
 * @branch main
 * @module ui/public/organisms
 *
 * @description
 * PublicGalleryNavList : liste d’images avec navigation (si href).
 *
 * @remarks
 * - Style 100% piloté par `ui` (skin).
 * - Le composant conserve uniquement la logique + a11y.
 * - Reveal : activé par défaut (V0.5).
 */

import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { PublicAppImage } from "@compoz/ui/site/components/atoms/PublicAppImage";
import { PublicNavLink } from "@compoz/ui/site/components/atoms/PublicNavLink";
import { PublicReveal } from "@compoz/ui/site/components/atoms/PublicReveal";
import type { PublicNavGalleryUi } from "@compoz/ui/site/public-ui.types";

export type GalleryNavListProps = Readonly<{
  images: ReadonlyArray<ImageEditorShape>;
  ui: PublicNavGalleryUi;
  columns: number;
  priority?: boolean;
}>;

export function PublicGalleryNavList({
  images,
  ui,
  columns,
  priority = false,
}: GalleryNavListProps) {
  const cols = Math.max(1, Math.floor(columns || 1));
  return (
    <ul className={cn(ui.list)}>
      {images.map((img, index) => {
        const normalized = __normalizeImage(img);
        if (!normalized.src) return null;
        const seed = index % cols;

        const key = __imageKey(normalized.id, index);

        const href = normalizeString(img.href, "");
        const label = normalizeString(img.alt, "");
        const ariaLabel = label || "Naviguer";

        const Figure = (
          <figure className={cn(ui.figure)}>
            <PublicAppImage
              image={{
                src: normalized.src,
                alt: "",
                width: img.width,
                height: img.height,
              }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={cn(ui.image)}
              priority={priority && index === 0}
              fetchPriority={priority && index === 0 ? "high" : "auto"}
            />

            {label ? (
              <figcaption className={cn(ui.overlayPanel)}>
                <div className={cn(ui.overlayContent)}>{label}</div>
              </figcaption>
            ) : null}
          </figure>
        );

        const Item = href ? (
          <PublicNavLink
            href={href}
            ariaLabel={ariaLabel}
            linkClassName={cn(ui.link)}
          >
            {Figure}
          </PublicNavLink>
        ) : (
          Figure
        );

        return (
          <li key={key}>
            <PublicReveal seedOrder={seed} staggerMs={60} amount={0.1}>
              {Item}
            </PublicReveal>
          </li>
        );
      })}
    </ul>
  );
}

PublicGalleryNavList.displayName = "PublicGalleryNavList";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function __normalizeImage(img: ImageEditorShape) {
  return {
    id: normalizeString(img.id, ""),
    src: normalizeString(img.src, ""),
    alt: normalizeString(img.alt, ""),
  } as const;
}

function __imageKey(id: string, index: number) {
  const safeId = id.trim();
  return toStableUiKey({ id: safeId || `gallery-${index}` }, index);
}
