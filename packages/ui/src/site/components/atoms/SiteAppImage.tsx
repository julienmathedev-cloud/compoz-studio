/**
 * @file packages/ui/src/site/components/atoms/SiteAppImage.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : enveloppe de `next/image` avec conventions A11y & perf (côté site/draft).
 *
 * @remarks
 * Invariants :
 * - `image.alt === ""` ⇒ image décorative (ignorée des lecteurs d’écran).
 * - `fill=true` ⇒ ne pas fournir `width/height`.
 * - `priority=true` ⇒ Next gère le preload ; `loading` est ignoré.
 * - `placeholder="blur"` :
 *   - OK avec `StaticImageData` (Next peut porter le blur automatiquement),
 *   - Pour une URL string, prévoir `blurDataURL` (LQIP base64) si tu veux un blur réel.
 *
 * Style :
 * - Le composant n’impose aucun style : `className` est fourni par le skin/template.
 */

import Image, { type StaticImageData } from "next/image";

import { normalizeString } from "@compoz/ui/lib/normalize";
import type { CSSProperties } from "react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteImageSource = string | StaticImageData;

export type SiteImage = Readonly<{
  src: SiteImageSource;
  alt?: string;
  width?: number;
  height?: number;
}>;

export type SiteAppImageProps = Readonly<{
  image: SiteImage;
  className?: string;
  priority?: boolean;
  fetchPriority?: "auto" | "high" | "low";
  decodingMode?: "sync" | "async" | "auto";
  sizes?: string;
  fill?: boolean;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  placeholder?: "empty" | "blur";
  blurDataURL?: string;
  style?: CSSProperties;
}>;

function isStaticImageData(src: SiteImageSource): src is StaticImageData {
  return typeof src === "object" && src !== null && "src" in src;
}

export function SiteAppImage({
  image,
  className,
  priority = false,
  fetchPriority = "auto",
  decodingMode,
  sizes,
  fill,
  ariaDescribedBy,
  ariaLabelledBy,
  placeholder = "empty",
  blurDataURL,
  style,
}: SiteAppImageProps) {
  const normalizedAlt = normalizeString(image.alt, "");
  const normalizedSizes = normalizeString(sizes, "");
  const normalizedDescribedBy = normalizeString(ariaDescribedBy);
  const normalizedLabelledBy = normalizeString(ariaLabelledBy);

  const isDecorative = normalizedAlt === "";
  const decoding = decodingMode ?? (priority ? "auto" : "async");
  const loading = priority ? undefined : "lazy";

  const staticDims = isStaticImageData(image.src)
    ? { width: image.src.width, height: image.src.height }
    : null;

  const dimensionProps = fill
    ? {}
    : {
        width: image.width ?? staticDims?.width,
        height: image.height ?? staticDims?.height,
      };

  if (!fill && (!dimensionProps.width || !dimensionProps.height)) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("[SiteAppImage] width/height required when fill=false");
    }
  }

  const describedBy =
    !isDecorative && normalizedDescribedBy ? normalizedDescribedBy : undefined;

  const labelledBy =
    !isDecorative && normalizedLabelledBy ? normalizedLabelledBy : undefined;

  return (
    <Image
      src={image.src}
      alt={normalizedAlt}
      {...dimensionProps}
      priority={priority}
      fetchPriority={fetchPriority}
      decoding={decoding}
      loading={loading}
      sizes={normalizedSizes || undefined}
      fill={fill}
      className={className}
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      placeholder={placeholder}
      blurDataURL={placeholder === "blur" ? blurDataURL : undefined}
      style={style}
    />
  );
}

SiteAppImage.displayName = "SiteAppImage";
