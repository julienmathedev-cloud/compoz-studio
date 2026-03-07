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
import { cn } from "@compoz/ui/lib/utils";

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
}: SiteAppImageProps) {
  const normalizedAlt = normalizeString(image.alt, "");
  const normalizedSizes = normalizeString(
    sizes,
    "(max-width: 767px) 100vw, 50vw",
  );
  const normalizedDescribedBy = normalizeString(ariaDescribedBy);
  const normalizedLabelledBy = normalizeString(ariaLabelledBy);

  const isDecorative = normalizedAlt === "";

  const decoding = decodingMode ?? (priority ? "auto" : "async");
  const loading = priority ? undefined : "lazy";

  // ✅ amélioration : si `src` est un StaticImageData, on récupère ses dimensions.
  const staticDims = isStaticImageData(image.src)
    ? { width: image.src.width, height: image.src.height }
    : null;

  let dimensionProps: { width?: number; height?: number } = {};

  if (!fill) {
    const width = image.width ?? staticDims?.width;
    const height = image.height ?? staticDims?.height;

    if (!width || !height) {
      if (process.env.NODE_ENV !== "production") {
        throw new Error("[SiteAppImage] width/height required when fill=false");
      }
    }

    dimensionProps = {
      width,
      height,
    };
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
      fetchPriority={priority ? undefined : fetchPriority}
      decoding={decoding}
      loading={loading}
      sizes={normalizedSizes}
      fill={fill}
      className={cn(className)}
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      placeholder={placeholder}
      blurDataURL={placeholder === "blur" ? blurDataURL : undefined}
    />
  );
}

SiteAppImage.displayName = "SiteAppImage";
