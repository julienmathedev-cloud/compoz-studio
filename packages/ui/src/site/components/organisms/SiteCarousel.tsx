"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteCarousel.tsx
 * @layer ui/site/components
 *
 * @description
 * Carousel site/draft générique avec autoplay simple, flèches et pagination optionnelles.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { SiteCarouselItem } from "@compoz/ui/site/components/organisms/SiteCarouselItem";
import type { NormalizedCarouselItem } from "@compoz/ui/site/components/organisms/carousel-item.types";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

const DEFAULT_INTERVAL_MS = 5000;
const MIN_INTERVAL_MS = 2000;
const FIRST_INTERVAL_MS = 2500;

function readPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  return Boolean(mq?.matches);
}

export type SiteCarouselProps = Readonly<{
  items: ReadonlyArray<NormalizedCarouselItem>;
  ui: SiteCarouselUi;
  showDots?: boolean;
  showArrows?: boolean;
  intervalMs?: number;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

export function SiteCarousel({
  items,
  ui,
  showDots = true,
  showArrows = false,
  intervalMs = DEFAULT_INTERVAL_MS,
  isFullBleed = false,
  priority = false,
}: SiteCarouselProps) {
  const count = items.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prefersReducedMotion] = useState(() => readPrefersReducedMotion());

  const hasAutoplay = !prefersReducedMotion && intervalMs > 0 && count > 1;
  const hasVisibleArrows = showArrows && count > 1;
  const safeMs = Math.max(intervalMs, MIN_INTERVAL_MS);
  const safeIndex = count === 0 ? 0 : Math.min(currentIndex, count - 1);
  const isImageOnly = items.every((item) => item.kind === "image");

  useEffect(() => {
    if (!hasAutoplay) {
      return;
    }

    let firstTimeout: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
    };

    const startInterval = () => {
      intervalId = setInterval(tick, safeMs);
    };

    const start = () => {
      if (firstTimeout || intervalId) {
        return;
      }

      firstTimeout = setTimeout(() => {
        tick();
        startInterval();
      }, FIRST_INTERVAL_MS);
    };

    if (document.visibilityState === "visible") {
      start();
    }

    const onVisibilityChange = () => {
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

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (firstTimeout) {
        clearTimeout(firstTimeout);
      }

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [count, hasAutoplay, safeMs]);

  if (count === 0) {
    return null;
  }

  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? count - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className={cn(
        ui.carousel.root,
        hasVisibleArrows && "px-6 sm:px-10 md:px-12 lg:px-16",
      )}
      aria-roledescription="carousel"
      aria-label="Carousel"
    >
      <p className="sr-only" aria-live="polite">
        Slide {safeIndex + 1} sur {count}
      </p>

      {hasVisibleArrows ? (
        <>
          <Button
            size="icon-lg"
            onClick={goPrev}
            aria-label="Slide précédent"
            className={cn(ui.carousel.arrowButton, "left-0")}
          >
            <ChevronLeft className={ui.carousel.arrowIcon} />
          </Button>

          <Button
            size="icon-lg"
            onClick={goNext}
            aria-label="Slide suivant"
            className={cn(ui.carousel.arrowButton, "right-0")}
          >
            <ChevronRight className={ui.carousel.arrowIcon} />
          </Button>
        </>
      ) : null}

      <div className={ui.carousel.viewport}>
        {isImageOnly ? (
          <div className={ui.carousel.track}>
            {items.map((item, index) => {
              const isActive = index === safeIndex;

              return (
                <div
                  key={item.id}
                  className={cn(
                    ui.carousel.slide,
                    isActive
                      ? ui.carousel.slideActive
                      : ui.carousel.slideInactive,
                  )}
                  aria-hidden={!isActive}
                >
                  <SiteCarouselItem
                    item={item}
                    ui={ui}
                    isFullBleed={isFullBleed}
                    priority={priority && index === 0}
                    isActive={isActive}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <SiteCarouselItem
            item={items[safeIndex]}
            ui={ui}
            isFullBleed={isFullBleed}
            priority={priority && safeIndex === 0}
            isActive
          />
        )}
      </div>

      {showDots && count > 1 ? (
        <div className={ui.carousel.dots}>
          {items.map((item, index) => {
            const isActive = index === safeIndex;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Aller au slide ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  ui.carousel.dot,
                  isActive ? ui.carousel.dotActive : ui.carousel.dotInactive,
                )}
                onClick={() => {
                  setCurrentIndex(index);
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

SiteCarousel.displayName = "SiteCarousel";
