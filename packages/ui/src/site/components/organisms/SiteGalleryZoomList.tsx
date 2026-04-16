"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteGalleryZoomList.tsx
 * @layer ui/site/organisms
 *
 * @description
 * SiteGalleryZoomList : liste d’images avec zoom sur clic (lightbox).
 *
 * @remarks
 * - UI-only : aucun style inline, tout vient du skin via `ui`.
 * - Défensif : ignore les images sans src.
 * - Index fiable : on filtre AVANT le render.
 * - Reveal : activable/désactivable via prop.
 */

import { useCallback, useMemo, useState } from "react";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteLightbox } from "@compoz/ui/site/components/molecules/SiteLightbox";

import type { SiteZoomGalleryUi } from "@compoz/ui/site/site-ui.types";
import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteGalleryZoomListProps = Readonly<{
  images: ReadonlyArray<ImageEditorShape>;
  ui: SiteZoomGalleryUi;
  columns: number;
  priority?: boolean;
  reveal?: boolean;
  onOpenAtIndex?: (index: number) => void;
}>;

type NormalizedImage = Readonly<{
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}>;

export function SiteGalleryZoomList({
  images,
  ui,
  columns,
  priority = false,
  reveal = true,
  onOpenAtIndex,
}: SiteGalleryZoomListProps) {
  const normalizedImages = useMemo<readonly NormalizedImage[]>(() => {
    const out: NormalizedImage[] = [];

    for (const img of images) {
      const id = normalizeString(img.id, "");
      const src = normalizeString(img.src, "");

      if (!src) {
        continue;
      }

      if (!img.width || !img.height) {
        continue;
      }

      const caption = normalizeString(
        typeof img.caption === "string" ? img.caption : "",
        "",
      );

      out.push({
        id,
        src,
        alt: normalizeString(img.alt, ""),
        caption: caption || undefined,
        width: img.width,
        height: img.height,
      });
    }

    return out;
  }, [images]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const openAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= normalizedImages.length) {
        return;
      }

      setOpenIndex(index);
      onOpenAtIndex?.(index);
    },
    [normalizedImages.length, onOpenAtIndex],
  );

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  const opened = openIndex != null ? normalizedImages[openIndex] : null;
  const cols = clampColumns(columns);
  const resolvedSizes = ui.sizesByColumns[cols];

  return (
    <>
      <ul className={cn(ui.list)} data-reveal={reveal ? "true" : "false"}>
        {normalizedImages.map((img, index) => {
          const seed = index % cols;
          const isExpanded = openIndex === index;
          const ariaLabel = img.caption || img.alt || "Agrandir l'image";

          const item = (
            <button
              type="button"
              onClick={() => openAt(index)}
              className={cn(ui.button)}
              aria-label={ariaLabel}
              aria-haspopup="dialog"
              aria-expanded={isExpanded}
            >
              <figure className={cn(ui.figure)}>
                <SiteAppImage
                  image={{
                    src: img.src,
                    alt: img.alt,
                    width: img.width,
                    height: img.height,
                  }}
                  sizes={resolvedSizes}
                  className={cn(ui.image)}
                  priority={priority && index === 0}
                  fetchPriority={priority && index === 0 ? "high" : "auto"}
                />

                {img.caption ? (
                  <figcaption className={cn(ui.overlayPanel)}>
                    <div className={cn(ui.overlayContent)}>{img.caption}</div>
                  </figcaption>
                ) : null}
              </figure>
            </button>
          );

          return (
            <li key={img.id}>
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

      {opened ? (
        <SiteLightbox
          ui={ui.lightbox}
          image={{ src: opened.src, alt: opened.alt }}
          caption={opened.caption}
          onClose={close}
          ariaLabel="Agrandissement de l’image"
        />
      ) : null}
    </>
  );
}

SiteGalleryZoomList.displayName = "SiteGalleryZoomList";

function clampColumns(v: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5 || v === 6 ? v : 3;
}
