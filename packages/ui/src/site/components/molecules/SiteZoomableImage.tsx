"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteZoomableImage.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders a public site image that can optionally open in a lightbox.
 *
 * @remarks
 * Uses `SiteAppImage` for inline rendering and `SiteLightbox` for zoomed display; the trigger remains a real button with a derived accessible label.
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
  image: SiteZoomableImageValue;
  caption?: string | null;
  buttonClassName?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fetchPriority?: "high" | "auto";
  lightboxUi: SiteLightboxUi;
  ariaLabel?: string;
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
