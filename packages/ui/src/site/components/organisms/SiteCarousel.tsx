"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteCarousel.tsx
 * @layer ui/site/components
 *
 * @description
 * Carrousel site/draft (V0.5) : autoplay simple par opacité.
 *
 * @remarks
 * - ✅ Zéro style inline “skin” : le container / l'image sont stylés via props.
 * - Autoplay désactivé si prefers-reduced-motion.
 * - Pause quand l’onglet est caché.
 * - Rend `null` si aucune image exploitable.
 */

import { useEffect, useMemo, useState } from "react";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import {
  SiteAppImage,
  type SiteImage,
} from "@compoz/ui/site/components/atoms/SiteAppImage";

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

function keyFromImage(img: SiteImage, index: number) {
  const srcKey =
    typeof img.src === "string" ? img.src : (img.src.src ?? `static-${index}`);
  return `${srcKey}::${index}`;
}

/**
 * Lecture PRM (prefers-reduced-motion).
 * - SSR-safe : retourne false côté serveur.
 * - Client : matchMedia.
 */
function readPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  return Boolean(mq?.matches);
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteCarouselProps = Readonly<{
  images: ReadonlyArray<SiteImage>;
  intervalMs?: number;
  className?: string;
  containerClassName?: string;
  imageClassName?: string;

  /**
   * Flag fonctionnel côté appelant (ex: le skin choisit les classes ratio/fill).
   * Le composant n’impose aucun style.
   */
  layout?: "ratio" | "fill";

  priority?: boolean;
}>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function SiteCarousel({
  images,
  intervalMs = DEFAULT_INTERVAL_MS,
  className,
  containerClassName,
  imageClassName,
  layout = "ratio",
  priority = false,
}: SiteCarouselProps) {
  /* ---------------------------------------------------------------------- */
  /* 1) Normalisation                                                       */
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
  /* 2) Autoplay guards                                                     */
  /* ---------------------------------------------------------------------- */

  // ✅ Valeur figée au mount : simple, stable, évite de relire matchMedia à chaque render.
  const [prefersReducedMotion] = useState(() => readPrefersReducedMotion());

  const hasAutoplay =
    !prefersReducedMotion && intervalMs > 0 && normalized.length > 1;

  const safeMs = Math.max(intervalMs, MIN_INTERVAL_MS);

  /* ---------------------------------------------------------------------- */
  /* 3) Autoplay lifecycle                                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasAutoplay) return;

    let firstTimeout: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
    };

    const startInterval = () => {
      intervalId = setInterval(tick, safeMs);
    };

    const start = () => {
      if (firstTimeout || intervalId) return;

      firstTimeout = setTimeout(() => {
        tick();
        startInterval();
      }, FIRST_INTERVAL_MS);
    };

    if (document.visibilityState === "visible") start();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        start();
        return;
      }

      if (firstTimeout) {
        clearTimeout(firstTimeout);
        firstTimeout = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
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
  /* 4) Guard                                                               */
  /* ---------------------------------------------------------------------- */

  if (count === 0) return null;

  /* ---------------------------------------------------------------------- */
  /* 5) Rendu                                                               */
  /* ---------------------------------------------------------------------- */

  const nextIndex = (safeIndex + 1) % count;
  const indices = count > 1 ? [safeIndex, nextIndex] : [safeIndex];

  // `layout` est un flag fonctionnel (le style est au niveau appelant).
  void layout;

  return (
    <div
      className={cn(containerClassName, className)}
      aria-roledescription="carousel"
      aria-label="Carousel"
    >
      <p className="sr-only" aria-live="polite">
        Slide {safeIndex + 1} sur {count}
      </p>

      {indices.map((index) => {
        const image = normalized[index];
        const isActive = index === safeIndex;

        return (
          <SiteAppImage
            key={keyFromImage(image, index)}
            image={image}
            fill
            sizes={DEFAULT_SIZES_FULL}
            className={cn(
              imageClassName,
              // Opacité = organisation (ok)
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

SiteCarousel.displayName = "SiteCarousel";
