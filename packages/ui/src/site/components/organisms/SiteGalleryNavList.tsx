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
 * - Reveal : activé par défaut (V0.5).
 */

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteNavLink } from "@compoz/ui/site/components/atoms/SiteNavLink";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";

import type { SiteNavGalleryUi } from "@compoz/ui/site/site-ui.types.ts";
import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteGalleryNavListProps = Readonly<{
  images: ReadonlyArray<ImageEditorShape>;
  ui: SiteNavGalleryUi;
  columns: number;
  priority?: boolean;
}>;

export function SiteGalleryNavList({
  images,
  ui,
  columns,
  priority = false,
}: SiteGalleryNavListProps) {
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
            <SiteAppImage
              image={{
                src: normalized.src,
                alt: "", // décoratif : caption/aria-label portent le sens
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
          <SiteNavLink
            href={href}
            ariaLabel={ariaLabel}
            linkClassName={cn(ui.link)}
          >
            {Figure}
          </SiteNavLink>
        ) : (
          Figure
        );

        return (
          <li key={key}>
            <SiteReveal seedOrder={seed} staggerMs={60} amount={0.1}>
              {Item}
            </SiteReveal>
          </li>
        );
      })}
    </ul>
  );
}

SiteGalleryNavList.displayName = "SiteGalleryNavList";

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
