"use client";
/**
 * @file packages/ui/src/site/components/organisms/PublicCarousel.tsx
 * @layer ui/public/organisms
 *
 * @description
 * Carrousel public/preview (V0.5) : autoplay simple par opacité.
 *
 * @remarks
 * - ✅ Zéro style inline “skin” : le container / l'image sont stylés via props.
 * - Autoplay désactivé si prefers-reduced-motion.
 * - Pause quand l’onglet est caché.
 * - Rend `null` si aucune image exploitable.
 */

import { useEffect, useMemo, useState } from "react";

import {
  PublicAppImage,
  type PublicImage,
} from "@compoz/ui/site/components/atoms/PublicAppImage";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_INTERVAL_MS = 5000;
const MIN_INTERVAL_MS = 2000;
const FIRST_INTERVAL_MS = 2500;

const DEFAULT_SIZES_FULL = "100vw";

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function keyFromImage(img: PublicImage, index: number) {
  const srcKey =
    typeof img.src === "string" ? img.src : (img.src.src ?? `static-${index}`);
  return `${srcKey}::${index}`;
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PublicCarouselProps = Readonly<{
  images: ReadonlyArray<PublicImage>;
  intervalMs?: number;
  className?: string;
  containerClassName?: string;
  imageClassName?: string;
  layout?: "ratio" | "fill";
  priority?: boolean;
}>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function PublicCarousel({
  images,
  intervalMs = DEFAULT_INTERVAL_MS,
  className,
  containerClassName,
  imageClassName,
  layout = "ratio",
  priority = false,
}: PublicCarouselProps) {
  /* ---------------------------------------------------------------------- */
  /* 1) Normalisation                                                        */
  /* ---------------------------------------------------------------------- */

  const normalized = useMemo(() => {
    return (images ?? [])
      .map((img) => ({
        ...img,
        alt: normalizeString(img.alt, ""),
      }))
      .filter((img) => Boolean(img?.src));
  }, [images]);

  const count = normalized.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ Clamp sans setState
  const safeIndex = count === 0 ? 0 : Math.min(currentIndex, count - 1);

  /* ---------------------------------------------------------------------- */
  /* 2) Autoplay guards                                                      */
  /* ---------------------------------------------------------------------- */

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const hasAutoplay = !reduced && intervalMs > 0 && count > 1;
  const safeMs = Math.max(intervalMs, MIN_INTERVAL_MS);

  /* ---------------------------------------------------------------------- */
  /* 3) Autoplay lifecycle                                                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasAutoplay) return;

    let firstTimeout: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
      }, safeMs);
    };

    const start = () => {
      if (firstTimeout || intervalId) return;

      firstTimeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
        startInterval();
      }, FIRST_INTERVAL_MS);
    };

    if (document.visibilityState === "visible") start();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        if (firstTimeout) {
          clearTimeout(firstTimeout);
          firstTimeout = null;
        }
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (firstTimeout) clearTimeout(firstTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [hasAutoplay, safeMs, count]);

  /* ---------------------------------------------------------------------- */
  /* 4) Guard                                                                */
  /* ---------------------------------------------------------------------- */

  if (count === 0) return null;

  /* ---------------------------------------------------------------------- */
  /* 5) Rendu                                                                */
  /* ---------------------------------------------------------------------- */

  const nextIndex = (safeIndex + 1) % count;
  const indices = count > 1 ? [safeIndex, nextIndex] : [safeIndex];

  // ⚠️ layout est un flag fonctionnel : pas de classes ici.
  void layout;

  return (
    <div
      className={cn(containerClassName, className)}
      aria-roledescription="carousel"
      aria-label="Carousel"
    >
      {/* sr-only = organisation/a11y (ok) */}
      <p className="sr-only" aria-live="polite">
        Slide {safeIndex + 1} sur {count}
      </p>

      {indices.map((index) => {
        const image = normalized[index];
        const isActive = index === safeIndex;

        return (
          <PublicAppImage
            key={keyFromImage(image, index)}
            image={image}
            fill
            sizes={DEFAULT_SIZES_FULL}
            className={cn(
              imageClassName,
              // opacity = organisation (ok)
              isActive ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!isActive}
            priority={priority && index === 0}
            fetchPriority={priority && index === 0 ? "high" : "auto"}
          />
        );
      })}
    </div>
  );
}

PublicCarousel.displayName = "PublicCarousel";
