/**
 * @file packages/ui/src/site/components/atoms/SiteAppImage.tsx
 * @layer ui/site/components/atoms
 *
 * @description
 * Wraps `next/image` with site rendering accessibility and performance conventions.
 *
 * @remarks
 * - Empty alt text marks decorative images.
 * - `fill` must not receive explicit dimensions.
 * - Priority images let Next handle preload semantics.
 * - Non-priority images default to lazy loading unless an explicit loading
 *   strategy is provided.
 * - Load callbacks support progressive image-loading orchestration.
 */

import Image, { type StaticImageData } from "next/image";
import type { CSSProperties, ReactEventHandler } from "react";

import { normalizeString } from "@compoz/ui/lib/normalize";

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
  loading?: "eager" | "lazy";
  fetchPriority?: "auto" | "high" | "low";
  decodingMode?: "sync" | "async" | "auto";
  sizes?: string;
  fill?: boolean;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  placeholder?: "empty" | "blur";
  blurDataURL?: string;
  style?: CSSProperties;
  onLoad?: ReactEventHandler<HTMLImageElement>;
}>;

function isStaticImageData(src: SiteImageSource): src is StaticImageData {
  return typeof src === "object" && src !== null && "src" in src;
}

export function SiteAppImage({
  image,
  className,
  priority = false,
  loading: loadingMode,
  fetchPriority = "auto",
  decodingMode,
  sizes,
  fill,
  ariaDescribedBy,
  ariaLabelledBy,
  placeholder = "empty",
  blurDataURL,
  style,
  onLoad,
}: SiteAppImageProps) {
  const normalizedAlt = normalizeString(image.alt, "");
  const normalizedSizes = normalizeString(sizes, "");
  const normalizedDescribedBy = normalizeString(ariaDescribedBy);
  const normalizedLabelledBy = normalizeString(ariaLabelledBy);

  const isDecorative = normalizedAlt === "";

  const decoding = decodingMode ?? (priority ? "auto" : "async");

  /*
   * Priority images already receive preload/eager semantics from Next.
   * All other images remain lazy unless the caller explicitly requests eager
   * loading for background prefetching or immediate navigation.
   */
  const resolvedLoading = priority ? undefined : (loadingMode ?? "lazy");

  const staticDimensions = isStaticImageData(image.src)
    ? {
        width: image.src.width,
        height: image.src.height,
      }
    : null;

  const dimensionProps = fill
    ? {}
    : {
        width: image.width ?? staticDimensions?.width,
        height: image.height ?? staticDimensions?.height,
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
      loading={resolvedLoading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      sizes={normalizedSizes || undefined}
      fill={fill}
      className={className}
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      placeholder={placeholder}
      blurDataURL={placeholder === "blur" ? blurDataURL : undefined}
      style={style}
      onLoad={onLoad}
    />
  );
}

SiteAppImage.displayName = "SiteAppImage";
