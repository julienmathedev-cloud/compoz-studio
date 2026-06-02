"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteZoomableImage.tsx
 * @layer ui/site/components
 *
 * @description
 * Image zoomable site/preview : rend une image cliquable ouvrant une lightbox.
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Repose sur `SiteAppImage` pour le rendu d’image.
 * - Réutilise `SiteLightbox` pour l’affichage plein écran.
 * - Le style du déclencheur et de l’image est injecté par le parent.
 * - Le composant reste volontairement générique pour être utilisé
 *   dans différents renderers (image simple, variantes futures, etc.).
 *
 * @accessibility
 * - Le déclencheur est un vrai bouton.
 * - `aria-haspopup="dialog"` est exposé pour signaler l’ouverture
 *   d’une lightbox.
 * - Le libellé accessible est dérivé de la caption, de l’alt,
 *   ou d’un fallback neutre.
 */

import { useCallback, useMemo, useState } from "react";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteLightbox } from "@compoz/ui/site/components/molecules/SiteLightbox";
import type { SiteLightboxUi } from "@compoz/ui/site/site-ui.types";

export type SiteZoomableImageValue = Readonly<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
}>;

export type SiteZoomableImageProps = Readonly<{
  /** Image source affichée dans la page et dans la lightbox. */
  image: SiteZoomableImageValue;
  /** Caption optionnelle utilisée dans la lightbox et pour l’aria-label. */
  caption?: string | null;
  /** Classes appliquées au bouton déclencheur. */
  buttonClassName?: string;
  /** Classes appliquées à l’image inline. */
  imageClassName?: string;
  /** Sizes passées à `SiteAppImage`. */
  sizes?: string;
  /** Priorité Next/Image. */
  priority?: boolean;
  /** Fetch priority Next/Image. */
  fetchPriority?: "high" | "auto";
  /** UI de la lightbox injectée par le parent / skin. */
  lightboxUi: SiteLightboxUi;
  /** Libellé d’accessibilité optionnel pour le déclencheur. */
  ariaLabel?: string;
  /** permet de rendre l'image zommable */
  zoomable?: boolean;
}>;

export function SiteZoomableImage({
  image,
  caption,
  buttonClassName,
  imageClassName,
  sizes,
  priority = false,
  fetchPriority = "auto",
  lightboxUi,
  ariaLabel,
  zoomable = false,
}: SiteZoomableImageProps) {
  const [open, setOpen] = useState(false);

  const src = normalizeString(image?.src, "");
  const alt = normalizeString(image?.alt, "");
  const resolvedCaption = normalizeString(caption ?? "", "");
  const resolvedAriaLabel = useMemo(() => {
    const explicit = normalizeString(ariaLabel ?? "", "");

    if (explicit) {
      return explicit;
    }

    if (resolvedCaption) {
      return resolvedCaption;
    }

    if (alt) {
      return alt;
    }

    return "Agrandir l’image";
  }, [alt, ariaLabel, resolvedCaption]);

  const openLightbox = useCallback(() => {
    if (!src) {
      return;
    }

    setOpen(true);
  }, [src]);

  const closeLightbox = useCallback(() => {
    setOpen(false);
  }, []);

  if (!src) {
    return null;
  }

  if (!zoomable) {
    return (
      <SiteAppImage
        image={{
          src,

          alt,

          width: image.width,

          height: image.height,
        }}
        sizes={sizes}
        className={cn(imageClassName)}
        priority={priority}
        fetchPriority={fetchPriority}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        className={cn(buttonClassName)}
        aria-label={resolvedAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SiteAppImage
          image={{
            src,
            alt,
            width: image.width,
            height: image.height,
          }}
          sizes={sizes}
          className={cn(imageClassName)}
          priority={priority}
          fetchPriority={fetchPriority}
        />
      </button>

      {open ? (
        <SiteLightbox
          ui={lightboxUi}
          image={{ src, alt }}
          caption={resolvedCaption || undefined}
          onClose={closeLightbox}
          ariaLabel={resolvedAriaLabel}
        />
      ) : null}
    </>
  );
}

SiteZoomableImage.displayName = "SiteZoomableImage";
