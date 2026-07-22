"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteCarousel.tsx
 * @layer ui/site/components/organisms
 *
 * @description
 * Renders a public site carousel with optional autoplay, arrows, dots, and full-bleed image mode.
 *
 * @remarks
 * - Autoplay respects reduced-motion preferences and pauses when the document is hidden.
 * - Image carousels initially mount the active, previous, and next images.
 * - Remaining images are mounted and loaded sequentially.
 * - Once mounted, an image remains in the DOM for the lifetime of the carousel.
 * - Image lifecycle handlers remain stable across slide changes.
 * - Image errors are captured by the slide wrapper instead of being passed
 *   directly to `next/image`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type {
  CarouselItemKindShape,
  CarouselItemShape,
  ImageEditorShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { SiteCarouselItem } from "@compoz/ui/site/components/organisms/SiteCarouselItem";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

const DEFAULT_INTERVAL_MS = 4000;

function readPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  return Boolean(mediaQuery?.matches);
}

function normalizeIndex(index: number, count: number): number {
  if (count === 0) {
    return 0;
  }

  return ((index % count) + count) % count;
}

function getInitialImageIndices(
  activeIndex: number,
  count: number,
): ReadonlySet<number> {
  const indices = new Set<number>();

  if (count === 0) {
    return indices;
  }

  indices.add(normalizeIndex(activeIndex, count));

  if (count > 1) {
    indices.add(normalizeIndex(activeIndex + 1, count));
  }

  if (count > 2) {
    indices.add(normalizeIndex(activeIndex - 1, count));
  }

  return indices;
}

function addIndex(
  previousIndices: ReadonlySet<number>,
  index: number,
): ReadonlySet<number> {
  if (previousIndices.has(index)) {
    return previousIndices;
  }

  const nextIndices = new Set(previousIndices);
  nextIndices.add(index);

  return nextIndices;
}

function haveAllRequestedImagesSettled(
  requestedIndices: ReadonlySet<number>,
  settledIndices: ReadonlySet<number>,
): boolean {
  for (const index of requestedIndices) {
    if (!settledIndices.has(index)) {
      return false;
    }
  }

  return true;
}

function findNextUnrequestedIndex(
  requestedIndices: ReadonlySet<number>,
  count: number,
): number | null {
  for (let index = 0; index < count; index += 1) {
    if (!requestedIndices.has(index)) {
      return index;
    }
  }

  return null;
}

export type SiteCarouselProps = Readonly<{
  itemKind: CarouselItemKindShape;
  items: ReadonlyArray<CarouselItemShape>;
  ui: SiteCarouselUi;
  showDots?: boolean;
  showArrows?: boolean;
  intervalMs?: number;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

export function SiteCarousel({
  itemKind,
  items,
  ui,
  showDots = true,
  showArrows = false,
  intervalMs = DEFAULT_INTERVAL_MS,
  isFullBleed = false,
  priority = false,
}: SiteCarouselProps) {
  const count = items.length;
  const isImageOnly = itemKind === "image";

  const itemsSignature = items.map((item) => item.id).join("|");

  const [currentIndex, setCurrentIndex] = useState(0);

  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const [requestedIndices, setRequestedIndices] = useState<ReadonlySet<number>>(
    () => (isImageOnly ? getInitialImageIndices(0, count) : new Set<number>()),
  );

  const [settledIndices, setSettledIndices] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );

  const [prefersReducedMotion] = useState(() => readPrefersReducedMotion());

  const safeIndex = count === 0 ? 0 : Math.min(currentIndex, count - 1);

  const activeItem = items[safeIndex];

  const hasAutoplay = !prefersReducedMotion && intervalMs > 0 && count > 1;

  const hasVisibleArrows = showArrows && count > 1;

  const markImageSettled = useCallback((index: number) => {
    setSettledIndices((previousIndices) => addIndex(previousIndices, index));
  }, []);

  /*
   * Keep one stable lifecycle handler per image.
   *
   * This prevents `next/image` from receiving a new callback reference every
   * time the active slide changes.
   */
  const imageSettledHandlers = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => () => {
        markImageSettled(index);
      }),
    [count, markImageSettled],
  );

  /*
   * Reset loading state only when the actual item collection changes.
   * Navigating between slides does not reset requested or settled images.
   */
  useEffect(() => {
    setCurrentIndex(0);
    setPendingIndex(null);
    setSettledIndices(new Set<number>());

    setRequestedIndices(
      isImageOnly ? getInitialImageIndices(0, count) : new Set<number>(),
    );
  }, [count, isImageOnly, itemsSignature]);

  /*
   * Once every currently requested image has settled, mount exactly one
   * additional image.
   */
  useEffect(() => {
    if (
      !isImageOnly ||
      count === 0 ||
      requestedIndices.size >= count ||
      !haveAllRequestedImagesSettled(requestedIndices, settledIndices)
    ) {
      return;
    }

    const nextIndex = findNextUnrequestedIndex(requestedIndices, count);

    if (nextIndex === null) {
      return;
    }

    setRequestedIndices((previousIndices) =>
      addIndex(previousIndices, nextIndex),
    );
  }, [count, isImageOnly, requestedIndices, settledIndices]);

  /*
   * Keep the current slide visible until a directly requested image has
   * loaded or failed.
   */
  useEffect(() => {
    if (pendingIndex === null || !settledIndices.has(pendingIndex)) {
      return;
    }

    setCurrentIndex(pendingIndex);

    setPendingIndex(null);
  }, [pendingIndex, settledIndices]);

  useEffect(() => {
    if (!hasAutoplay) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      setCurrentIndex((previousIndex) =>
        previousIndex === count - 1 ? 0 : previousIndex + 1,
      );
    };

    const start = () => {
      if (intervalId !== null) {
        return;
      }

      intervalId = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (intervalId === null) {
        return;
      }

      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        start();
        return;
      }

      stop();
    };

    if (document.visibilityState === "visible") {
      start();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      stop();
    };
  }, [count, hasAutoplay, intervalMs]);

  if (!activeItem) {
    return null;
  }

  const requestSlide = (index: number) => {
    const targetIndex = normalizeIndex(index, count);

    if (!isImageOnly || settledIndices.has(targetIndex)) {
      setPendingIndex(null);
      setCurrentIndex(targetIndex);
      return;
    }

    setRequestedIndices((previousIndices) =>
      addIndex(previousIndices, targetIndex),
    );

    setPendingIndex(targetIndex);
  };

  const activeCaption =
    itemKind === "image"
      ? ((activeItem as ImageEditorShape).caption ?? "").trim()
      : "";

  const goPrev = () => {
    requestSlide(safeIndex - 1);
  };

  const goNext = () => {
    requestSlide(safeIndex + 1);
  };

  return (
    <div
      className={cn(
        ui.carousel.root,
        hasVisibleArrows && "px-6 sm:px-10 md:px-12 lg:px-16",
      )}
      aria-roledescription="carousel"
      aria-label="Carousel"
      aria-busy={pendingIndex !== null}
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
            <ChevronLeft className={ui.carousel.arrowIcon} aria-hidden="true" />
          </Button>

          <Button
            size="icon-lg"
            onClick={goNext}
            aria-label="Slide suivant"
            className={cn(ui.carousel.arrowButton, "right-0")}
          >
            <ChevronRight
              className={ui.carousel.arrowIcon}
              aria-hidden="true"
            />
          </Button>
        </>
      ) : null}

      <div
        className={cn(
          isFullBleed ? ui.carousel.viewportFullBleed : ui.carousel.viewport,
        )}
      >
        {isImageOnly ? (
          <div className={ui.carousel.track}>
            {items.map((item, index) => {
              if (!requestedIndices.has(index)) {
                return null;
              }

              const isActive = index === safeIndex;

              const isPriorityImage = priority && index === 0;

              const settledHandler = imageSettledHandlers[index];

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
                  onErrorCapture={settledHandler}
                >
                  <SiteCarouselItem
                    item={item}
                    itemKind={itemKind}
                    ui={ui}
                    mode="carousel"
                    isFullBleed={isFullBleed}
                    priority={isPriorityImage}
                    isActive={isActive}
                    imageLoading={isPriorityImage ? undefined : "eager"}
                    imageFetchPriority={isPriorityImage ? "high" : "low"}
                    onImageLoad={settledHandler}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <SiteCarouselItem
            item={activeItem}
            itemKind={itemKind}
            ui={ui}
            isFullBleed={isFullBleed}
            priority={priority && safeIndex === 0}
            isActive
          />
        )}
      </div>

      {activeCaption && !isFullBleed ? (
        <p className={ui.imageItem.caption}>{activeCaption}</p>
      ) : null}

      {showDots && count > 1 ? (
        <div className={ui.carousel.dots}>
          {items.map((item, index) => {
            const isActive = index === safeIndex;

            const isPending = index === pendingIndex;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Aller au slide ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                aria-busy={isPending ? "true" : undefined}
                className={cn(
                  ui.carousel.dot,
                  isActive ? ui.carousel.dotActive : ui.carousel.dotInactive,
                )}
                onClick={() => {
                  requestSlide(index);
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
