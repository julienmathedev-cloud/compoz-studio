"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteSlider.tsx
 * @layer ui/site/components
 *
 * @description
 * Slider générique basé sur Keen Slider avec voisins visibles,
 * flèches et pagination optionnelles.
 */

import "keen-slider/keen-slider.min.css";

import { useKeenSlider } from "keen-slider/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { SiteCarouselItem } from "@compoz/ui/site/components/organisms/SiteCarouselItem";
import type { NormalizedCarouselItem } from "@compoz/ui/site/components/organisms/carousel-item.types";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

export type SiteSliderProps = Readonly<{
  items: ReadonlyArray<NormalizedCarouselItem>;
  ui: SiteCarouselUi;
  showDots?: boolean;
  showArrows?: boolean;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

export function SiteSlider({
  items,
  ui,
  showDots = true,
  showArrows = true,
  isFullBleed = false,
  priority = false,
}: SiteSliderProps) {
  const count = items.length;
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const hasVisibleArrows = showArrows && count > 1;

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: count > 1,
    slideChanged: (slider) => {
      setCurrentSlide(slider.track.details.rel);
    },
    slides: {
      origin: "center",
      perView: 1.15,
      spacing: 8,
    },
    breakpoints: {
      "(min-width: 480px)": {
        slides: { origin: "center", perView: 1.2, spacing: 12 },
      },
      "(min-width: 640px)": {
        slides: { origin: "center", perView: 1.3, spacing: 16 },
      },
      "(min-width: 768px)": {
        slides: { origin: "center", perView: 1.5, spacing: 24 },
      },
      "(min-width: 1024px)": {
        slides: { origin: "center", perView: 1.7, spacing: 32 },
      },
    },
  });

  if (count === 0) {
    return null;
  }

  return (
    <div
      className={ui.slider.root}
      role="region"
      aria-label="Slider"
      aria-roledescription="carousel"
    >
      {hasVisibleArrows ? (
        <>
          <Button
            size="icon"
            onClick={() => instanceRef.current?.prev()}
            aria-label="Slide précédent"
            className={cn(ui.slider.arrowButton, "left-0")}
          >
            <ChevronLeft className={ui.slider.arrowIcon} aria-hidden="true" />
          </Button>

          <Button
            size="icon"
            onClick={() => instanceRef.current?.next()}
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

            return (
              <div
                key={item.id}
                role="group"
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  "keen-slider__slide",
                  ui.slider.slide,
                  isActive ? ui.slider.slideActive : ui.slider.slideInactive,
                )}
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
      </div>

      {showDots && count > 1 ? (
        <div className={ui.slider.dots}>
          {items.map((item, index) => {
            const isActive = index === currentSlide;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Aller au slide ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  ui.slider.dot,
                  isActive ? ui.slider.dotActive : ui.slider.dotInactive,
                )}
                onClick={() => instanceRef.current?.moveToIdx(index)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

SiteSlider.displayName = "SiteSlider";
