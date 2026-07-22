"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteSlider.tsx
 * @layer ui/site/components/organisms
 *
 * @description
 * Renders a public site Keen Slider with visible neighboring slides,
 * optional arrows, dots, and full-bleed item mode.
 *
 * @remarks
 * - Keeps every Keen slide wrapper mounted so slider geometry remains stable.
 * - Image sliders initially mount the active, previous, and next images.
 * - Remaining images are mounted and loaded sequentially.
 * - Navigation waits for an unloaded target image before moving to it.
 * - Image lifecycle handlers remain stable across slide changes.
 * - Image errors are captured by the slide wrapper instead of being passed
 *   directly to `next/image`.
 * - Keeps the slider invisible until Keen has calculated its final layout.
 * - Re-bases Keen Slider loop indexes after wraparound.
 */

import "keen-slider/keen-slider.min.css";

import { useKeenSlider } from "keen-slider/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  CarouselItemKindShape,
  CarouselItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { SiteCarouselItem } from "@compoz/ui/site/components/organisms/SiteCarouselItem";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

export type SiteSliderProps = Readonly<{
  itemKind: CarouselItemKindShape;
  items: ReadonlyArray<CarouselItemShape>;
  ui: SiteCarouselUi;
  showDots?: boolean;
  showArrows?: boolean;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

type PendingSliderNavigation = Readonly<{
  /**
   * Index passed to Keen Slider.
   *
   * Previous and next navigation use an absolute loop index, while dots use
   * the relative item index.
   */
  targetIndex: number;

  /**
   * Normalized item index whose image must settle before navigation.
   */
  imageIndex: number;
}>;

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

function shouldNormalizeLoopAbsIndex(
  absoluteIndex: number,
  count: number,
): boolean {
  if (count <= 1) {
    return false;
  }

  return Math.abs(absoluteIndex) >= count;
}

export function SiteSlider({
  itemKind,
  items,
  ui,
  showDots = true,
  showArrows = true,
  isFullBleed = false,
  priority = false,
}: SiteSliderProps) {
  const count = items.length;
  const isImageOnly = itemKind === "image";

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderReady, setIsSliderReady] = useState(false);

  const [pendingNavigation, setPendingNavigation] =
    useState<PendingSliderNavigation | null>(null);

  const [requestedIndices, setRequestedIndices] = useState<ReadonlySet<number>>(
    () => (isImageOnly ? getInitialImageIndices(0, count) : new Set<number>()),
  );

  const [settledIndices, setSettledIndices] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );

  const isAnimatingRef = useRef(false);
  const isRebasingRef = useRef(false);
  const readyFrameRef = useRef<number | null>(null);

  const hasVisibleArrows = showArrows && count > 1;

  const itemsSignature = items.map((item) => item.id).join("|");

  const markSliderReady = useCallback(() => {
    if (readyFrameRef.current !== null) {
      cancelAnimationFrame(readyFrameRef.current);
    }

    readyFrameRef.current = requestAnimationFrame(() => {
      readyFrameRef.current = null;
      setIsSliderReady(true);
    });
  }, []);

  const markImageSettled = useCallback((index: number) => {
    setSettledIndices((previousIndices) => addIndex(previousIndices, index));
  }, []);

  /*
   * Keep one stable lifecycle handler per image.
   *
   * Passing callbacks created directly inside the render loop would give
   * `next/image` a new handler reference whenever the active slide changes.
   */
  const imageSettledHandlers = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => () => {
        markImageSettled(index);
      }),
    [count, markImageSettled],
  );

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: count > 1,

    created: (slider) => {
      isAnimatingRef.current = false;

      setCurrentSlide(slider.track.details.rel);

      markSliderReady();
    },

    slideChanged: (slider) => {
      setCurrentSlide(slider.track.details.rel);
    },

    animationStarted: () => {
      isAnimatingRef.current = true;
    },

    animationEnded: (slider) => {
      isAnimatingRef.current = false;

      const relativeIndex = slider.track.details.rel;

      const absoluteIndex = slider.track.details.abs;

      if (isRebasingRef.current) {
        return;
      }

      if (!shouldNormalizeLoopAbsIndex(absoluteIndex, count)) {
        return;
      }

      isRebasingRef.current = true;

      requestAnimationFrame(() => {
        slider.moveToIdx(relativeIndex, true, {
          duration: 0,
        });

        requestAnimationFrame(() => {
          isRebasingRef.current = false;
        });
      });
    },

    slides: {
      origin: "center",
      perView: 1.15,
      spacing: 8,
    },

    breakpoints: {
      "(min-width: 480px)": {
        slides: {
          origin: "center",
          perView: 1.2,
          spacing: 12,
        },
      },

      "(min-width: 640px)": {
        slides: {
          origin: "center",
          perView: 1.3,
          spacing: 16,
        },
      },

      "(min-width: 768px)": {
        slides: {
          origin: "center",
          perView: 1.5,
          spacing: 24,
        },
      },

      "(min-width: 1024px)": {
        slides: {
          origin: "center",
          perView: 1.7,
          spacing: 32,
        },
      },
    },
  });

  /*
   * Reset progressive loading only when the actual item collection changes.
   * Slide navigation must not reset requested or settled images.
   */
  useEffect(() => {
    setIsSliderReady(false);
    setPendingNavigation(null);
    setSettledIndices(new Set<number>());

    setRequestedIndices(
      isImageOnly
        ? getInitialImageIndices(currentSlide, count)
        : new Set<number>(),
    );
  }, [count, isImageOnly, itemsSignature]);

  /*
   * Recalculate Keen Slider when the collection changes.
   *
   * The slider remains invisible until Keen has applied the resulting layout.
   */
  useEffect(() => {
    const slider = instanceRef.current;

    if (!slider) {
      return;
    }

    const updateFrameId = requestAnimationFrame(() => {
      slider.update();

      setCurrentSlide(slider.track.details.rel);

      setPendingNavigation(null);

      isAnimatingRef.current = false;
      isRebasingRef.current = false;

      markSliderReady();
    });

    return () => {
      cancelAnimationFrame(updateFrameId);
    };
  }, [count, itemsSignature, instanceRef, markSliderReady]);

  /*
   * Cancel a pending visibility frame when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (readyFrameRef.current !== null) {
        cancelAnimationFrame(readyFrameRef.current);
      }
    };
  }, []);

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
   * Complete delayed navigation once its target image has loaded or failed.
   */
  useEffect(() => {
    if (
      pendingNavigation === null ||
      !settledIndices.has(pendingNavigation.imageIndex)
    ) {
      return;
    }

    const slider = instanceRef.current;

    if (!slider) {
      return;
    }

    const blocked =
      isAnimatingRef.current || isRebasingRef.current || slider.animator.active;

    if (blocked) {
      return;
    }

    const targetIndex = pendingNavigation.targetIndex;

    setPendingNavigation(null);

    slider.moveToIdx(targetIndex, true);
  }, [pendingNavigation, settledIndices, instanceRef]);

  if (count === 0) {
    return null;
  }

  const requestNavigation = (targetIndex: number, imageIndex: number) => {
    const slider = instanceRef.current;

    if (!slider || pendingNavigation !== null) {
      return;
    }

    const blocked =
      isAnimatingRef.current || isRebasingRef.current || slider.animator.active;

    if (blocked) {
      return;
    }

    const normalizedImageIndex = normalizeIndex(imageIndex, count);

    if (!isImageOnly || settledIndices.has(normalizedImageIndex)) {
      slider.moveToIdx(targetIndex, true);

      return;
    }

    setRequestedIndices((previousIndices) =>
      addIndex(previousIndices, normalizedImageIndex),
    );

    setPendingNavigation({
      targetIndex,
      imageIndex: normalizedImageIndex,
    });
  };

  const handlePrev = () => {
    const slider = instanceRef.current;

    if (!slider) {
      return;
    }

    const targetAbsoluteIndex = slider.track.details.abs - 1;

    requestNavigation(targetAbsoluteIndex, targetAbsoluteIndex);
  };

  const handleNext = () => {
    const slider = instanceRef.current;

    if (!slider) {
      return;
    }

    const targetAbsoluteIndex = slider.track.details.abs + 1;

    requestNavigation(targetAbsoluteIndex, targetAbsoluteIndex);
  };

  const handleDotClick = (index: number) => {
    requestNavigation(index, index);
  };

  return (
    <div
      className={cn(ui.slider.root, isSliderReady ? "visible" : "invisible")}
      role="region"
      aria-label="Slider"
      aria-roledescription="carousel"
      aria-busy={!isSliderReady || pendingNavigation !== null}
    >
      {hasVisibleArrows ? (
        <>
          <Button
            size="icon"
            onClick={handlePrev}
            aria-label="Slide précédent"
            className={cn(ui.slider.arrowButton, "left-0")}
          >
            <ChevronLeft className={ui.slider.arrowIcon} aria-hidden="true" />
          </Button>

          <Button
            size="icon"
            onClick={handleNext}
            aria-label="Slide suivant"
            className={cn(ui.slider.arrowButton, "right-0")}
          >
            <ChevronRight className={ui.slider.arrowIcon} aria-hidden="true" />
          </Button>
        </>
      ) : null}

      <div
        className={cn(hasVisibleArrows && "px-6 sm:px-10 md:px-12 lg:px-16")}
      >
        <div ref={sliderRef} className={cn("keen-slider", ui.slider.track)}>
          {items.map((item, index) => {
            const isActive = index === currentSlide;

            const shouldRenderItem =
              !isImageOnly || requestedIndices.has(index);

            const isPriorityImage = priority && index === 0;

            const settledHandler = imageSettledHandlers[index];

            return (
              <div
                key={item.id}
                role="group"
                tabIndex={isActive ? 0 : -1}
                data-slide-index={index}
                data-slide-active={isActive ? "true" : "false"}
                className={cn(
                  "keen-slider__slide",
                  ui.slider.slide,
                  isActive ? ui.slider.slideActive : ui.slider.slideInactive,
                )}
                onErrorCapture={isImageOnly ? settledHandler : undefined}
              >
                {shouldRenderItem ? (
                  <SiteCarouselItem
                    item={item}
                    itemKind={itemKind}
                    ui={ui}
                    mode="slider"
                    isFullBleed={isFullBleed}
                    priority={isPriorityImage}
                    isActive={isActive}
                    imageLoading={isPriorityImage ? undefined : "eager"}
                    imageFetchPriority={isPriorityImage ? "high" : "low"}
                    onImageLoad={settledHandler}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {showDots && count > 1 ? (
        <div className={ui.slider.dots}>
          {items.map((item, index) => {
            const isActive = index === currentSlide;

            const isPending = pendingNavigation?.imageIndex === index;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Aller au slide ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                aria-busy={isPending ? "true" : undefined}
                className={cn(
                  ui.slider.dot,
                  isActive ? ui.slider.dotActive : ui.slider.dotInactive,
                )}
                onClick={() => {
                  handleDotClick(index);
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

SiteSlider.displayName = "SiteSlider";
