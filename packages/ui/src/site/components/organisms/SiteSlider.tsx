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
import type { SiteSliderUi } from "@compoz/ui/site/site-ui.types";

export type SiteSliderProps<T> = Readonly<{
  items: ReadonlyArray<T>;
  ui: SiteSliderUi;
  showDots?: boolean;
  showArrows?: boolean;
  renderItem: (
    item: T,
    ctx: Readonly<{
      index: number;
      isActive: boolean;
    }>,
  ) => React.ReactNode;
}>;

export function SiteSlider<T>({
  items,
  ui,
  showDots = true,
  showArrows = true,
  renderItem,
}: SiteSliderProps<T>) {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: items.length > 1,
    slideChanged: (slider) => setCurrentSlide(slider.track.details.rel),
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

  if (!items.length) return null;

  return (
    <div
      className={ui.root}
      role="region"
      aria-label="Slider"
      aria-roledescription="carousel"
    >
      {showArrows && items.length > 1 ? (
        <>
          <Button
            size="icon"
            onClick={() => instanceRef.current?.prev()}
            aria-label="Slide précédent"
            className={ui.arrowButton}
          >
            <ChevronLeft className={ui.arrowIcon} aria-hidden="true" />
          </Button>

          <Button
            size="icon"
            onClick={() => instanceRef.current?.next()}
            aria-label="Slide suivant"
            className={ui.arrowButton}
          >
            <ChevronRight className={ui.arrowIcon} aria-hidden="true" />
          </Button>
        </>
      ) : null}

      <div ref={sliderRef} className={cn("keen-slider", ui.track)}>
        {items.map((item, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={index}
              role="group"
              tabIndex={isActive ? 0 : -1}
              className={cn(
                "keen-slider__slide",
                ui.slide,
                isActive ? ui.slideActive : ui.slideInactive,
              )}
            >
              {renderItem(item, { index, isActive })}
            </div>
          );
        })}
      </div>

      {showDots && items.length > 1 ? (
        <div className={ui.dots}>
          {items.map((_, index) => {
            const isActive = index === currentSlide;

            return (
              <button
                key={index}
                type="button"
                aria-label={`Aller au slide ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(ui.dot, isActive ? ui.dotActive : ui.dotInactive)}
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
