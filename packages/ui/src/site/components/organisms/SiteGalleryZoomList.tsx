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
 * - Reveal : activé par défaut (V0.5).
 */

import { useCallback, useMemo, useState } from "react";

import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteLightbox } from "@compoz/ui/site/components/molecules/SiteLightbox";

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

import type { SiteZoomGalleryUi } from "@compoz/ui/site/site-ui.types.ts";
import type { ImageEditorShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteGalleryZoomListProps = Readonly<{
  images: ReadonlyArray<ImageEditorShape>;
  ui: SiteZoomGalleryUi;
  columns: number;
  priority?: boolean;

  /** Optionnel : instrumentation / analytics */
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
  onOpenAtIndex,
}: SiteGalleryZoomListProps) {
  // ✅ images normalisées + filtrées (index fiable)
  const normalizedImages = useMemo<readonly NormalizedImage[]>(() => {
    const out: NormalizedImage[] = [];

    for (const img of images ?? []) {
      const id = normalizeString(img.id, "");
      const src = normalizeString(img.src, "");
      if (!src) continue;

      // sécurité hard : éviter layout shift / erreurs next/image
      if (!img.width || !img.height) continue;

      out.push({
        id,
        src,
        alt: normalizeString(img.alt, ""),
        caption: normalizeString(
          typeof img.caption === "string" ? img.caption : "",
          "",
        ),
        width: img.width,
        height: img.height,
      });
    }

    return out;
  }, [images]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const openAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= normalizedImages.length) return;
      setOpenIndex(index);
      onOpenAtIndex?.(index);
    },
    [normalizedImages.length, onOpenAtIndex],
  );

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  const opened = openIndex != null ? normalizedImages[openIndex] : null;
  const cols = Math.max(1, Math.floor(columns || 1));

  return (
    <>
      <ul className={cn(ui.list)}>
        {normalizedImages.map((img, index) => {
          const label = normalizeString(img.alt, "");
          const key = __imageKey(img.id, index);
          const seed = index % cols;

          const isExpanded = openIndex === index;

          const Item = (
            <button
              type="button"
              onClick={() => openAt(index)}
              className={cn(ui.button)}
              aria-label={label || "Agrandir l'image"}
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
            </button>
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

      {/* ✅ Lightbox (montée seulement quand ouverte) */}
      {opened ? (
        <SiteLightbox
          ui={ui.lightbox}
          image={{ src: opened.src, alt: opened.alt }}
          caption={opened.caption || undefined}
          onClose={close}
          ariaLabel="Agrandissement de l’image"
        />
      ) : null}
    </>
  );
}

SiteGalleryZoomList.displayName = "SiteGalleryZoomList";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function __imageKey(id: string, index: number) {
  const safeId = id.trim();
  return toStableUiKey({ id: safeId || `gallery-${index}` }, index);
}
