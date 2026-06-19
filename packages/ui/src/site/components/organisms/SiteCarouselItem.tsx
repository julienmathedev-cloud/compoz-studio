/**
 * @file packages/ui/src/site/components/organisms/SiteCarouselItem.tsx
 * @layer ui/site/components
 *
 * @description
 * Rendu partagé d’un item de carousel / slider.
 */

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteCard } from "@compoz/ui/site/components/molecules/SiteCard";
import { SiteExtendedCard } from "@compoz/ui/site/components/molecules/SiteExtendedCard";
import { SiteStructuredCard } from "@compoz/ui/site/components/molecules/SiteStructuredCard";
import type { NormalizedCarouselItem } from "@compoz/ui/site/components/organisms/carousel-item.types";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";
import type { CSSProperties } from "react";

export type SiteCarouselItemProps = Readonly<{
  item: NormalizedCarouselItem;
  ui: SiteCarouselUi;
  mode?: "carousel" | "slider";
  isFullBleed?: boolean;
  priority?: boolean;
  isActive?: boolean;
}>;

export function SiteCarouselItem({
  item,
  ui,
  mode = "carousel",
  isFullBleed = false,
  priority = false,
  isActive = false,
}: SiteCarouselItemProps) {
  const contentStateClassName = isActive
    ? ui.contentItem.active
    : ui.contentItem.inactive;

  if (item.kind === "image") {
    const imageUi = mode === "slider" ? ui.imageItemSlider : ui.imageItem;

    if (mode === "slider") {
      const hasImageDimensions =
        typeof item.width === "number" &&
        item.width > 0 &&
        typeof item.height === "number" &&
        item.height > 0;

      const imageRatio = hasImageDimensions ? item.width / item.height : 16 / 9;

      const containedImageStyle: CSSProperties = {
        width: `min(100%, calc(70vh * ${imageRatio}))`,
        height: "auto",
        maxHeight: "70vh",
      };

      return (
        <div
          className={
            isFullBleed ? imageUi.fillContainer : imageUi.ratioContainer
          }
        >
          <SiteAppImage
            image={{
              src: item.src,
              alt: item.alt,
              width: item.width,
              height: item.height,
            }}
            sizes="100vw"
            className={
              isFullBleed ? imageUi.coverImage : imageUi.containedImage
            }
            style={isFullBleed ? undefined : containedImageStyle}
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
          />
        </div>
      );
    }

    return (
      <div
        className={isFullBleed ? imageUi.fillContainer : imageUi.ratioContainer}
      >
        <SiteAppImage
          image={{
            src: item.src,
            alt: item.alt,
            width: item.width,
            height: item.height,
          }}
          fill
          sizes="100vw"
          className={isFullBleed ? imageUi.coverImage : imageUi.containedImage}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>
    );
  }

  if (item.kind === "card") {
    return (
      <div className={contentStateClassName}>
        <SiteCard
          title={item.title}
          description={item.description}
          icon={
            item.icon
              ? renderContentIcon(item.icon, { className: ui.card.icon })
              : undefined
          }
          ui={ui.card}
        />
      </div>
    );
  }

  if (item.kind === "extendedCard") {
    return (
      <div className={contentStateClassName}>
        <SiteExtendedCard
          title={item.title}
          description={item.description}
          bullets={item.bullets}
          footer={item.footer}
          icon={
            item.icon
              ? renderContentIcon(item.icon, {
                  className: ui.extendedCard.icon,
                })
              : undefined
          }
          align="left"
          ui={ui.extendedCard}
        />
      </div>
    );
  }

  return (
    <div className={contentStateClassName}>
      <SiteStructuredCard
        title={item.title}
        meta={item.meta}
        sections={item.sections}
        image={item.image}
        button={item.button}
        ui={ui.structuredCard}
      />
    </div>
  );
}

SiteCarouselItem.displayName = "SiteCarouselItem";
