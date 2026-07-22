/**
 * @file packages/ui/src/site/components/organisms/SiteCarouselItem.tsx
 * @layer ui/site/components/organisms
 *
 * @description
 * Renders one validated carousel or slider item.
 *
 * @remarks
 * - Image items use `SiteAppImage`.
 * - Image load callbacks and network hints are forwarded to support
 *   progressive loading in carousels and sliders.
 * - Card-like items delegate to the matching public site card component.
 */

import type { CSSProperties, ReactEventHandler } from "react";

import type {
  CardItemShape,
  CarouselItemKindShape,
  CarouselItemShape,
  ExtendedCardItemShape,
  ImageEditorShape,
  StructuredCardItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteCard } from "@compoz/ui/site/components/molecules/SiteCard";
import { SiteExtendedCard } from "@compoz/ui/site/components/molecules/SiteExtendedCard";
import { SiteStructuredCard } from "@compoz/ui/site/components/molecules/SiteStructuredCard";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

export type SiteCarouselItemProps = Readonly<{
  item: CarouselItemShape;
  itemKind: CarouselItemKindShape;
  ui: SiteCarouselUi;
  mode?: "carousel" | "slider";
  isFullBleed?: boolean;
  priority?: boolean;
  isActive?: boolean;
  imageLoading?: "eager" | "lazy";
  imageFetchPriority?: "auto" | "high" | "low";
  onImageLoad?: ReactEventHandler<HTMLImageElement>;
}>;

export function SiteCarouselItem({
  item,
  itemKind,
  ui,
  mode = "carousel",
  isFullBleed = false,
  priority = false,
  isActive = false,
  imageLoading,
  imageFetchPriority = "auto",
  onImageLoad,
}: SiteCarouselItemProps) {
  const contentStateClassName = isActive
    ? ui.contentItem.active
    : ui.contentItem.inactive;

  if (itemKind === "image") {
    const image = item as ImageEditorShape;
    const imageUi = mode === "slider" ? ui.imageItemSlider : ui.imageItem;

    /*
     * Next.js priority images already receive eager/preload semantics.
     * Avoid combining `priority` with an explicit `loading` value.
     */
    const resolvedLoading = priority ? undefined : imageLoading;

    const resolvedFetchPriority = priority ? "high" : imageFetchPriority;

    if (mode === "slider") {
      const hasImageDimensions = image.width > 0 && image.height > 0;

      const imageRatio = hasImageDimensions
        ? image.width / image.height
        : 16 / 9;

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
              src: image.src,
              alt: image.alt,
              width: image.width,
              height: image.height,
            }}
            sizes="100vw"
            className={
              isFullBleed ? imageUi.coverImage : imageUi.containedImage
            }
            style={isFullBleed ? undefined : containedImageStyle}
            priority={priority}
            loading={resolvedLoading}
            fetchPriority={resolvedFetchPriority}
            onLoad={onImageLoad}
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
            src: image.src,
            alt: image.alt,
            width: image.width,
            height: image.height,
          }}
          fill
          sizes="100vw"
          className={isFullBleed ? imageUi.coverImage : imageUi.containedImage}
          priority={priority}
          loading={resolvedLoading}
          fetchPriority={resolvedFetchPriority}
          onLoad={onImageLoad}
        />
      </div>
    );
  }

  if (itemKind === "card") {
    const card = item as CardItemShape;

    return (
      <div className={contentStateClassName}>
        <SiteCard
          eyebrow={card.eyebrow ?? undefined}
          title={card.title}
          description={card.description}
          icon={
            card.icon
              ? renderContentIcon(card.icon, {
                  className: ui.card.icon,
                })
              : undefined
          }
          button={card.button ?? undefined}
          ui={ui.card}
        />
      </div>
    );
  }

  if (itemKind === "extendedCard") {
    const card = item as ExtendedCardItemShape;

    return (
      <div className={contentStateClassName}>
        <SiteExtendedCard
          eyebrow={card.eyebrow ?? undefined}
          title={card.title}
          description={card.description}
          bullets={card.bullets}
          footer={card.footer ?? undefined}
          button={card.button ?? undefined}
          icon={
            card.icon
              ? renderContentIcon(card.icon, {
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

  const card = item as StructuredCardItemShape;

  return (
    <div className={contentStateClassName}>
      <SiteStructuredCard
        title={card.title}
        meta={card.meta ?? undefined}
        sections={card.sections}
        image={
          card.image
            ? {
                src: card.image.src,
                alt: card.image.alt,
                width: card.image.width,
                height: card.image.height,
                caption: card.image.caption ?? undefined,
              }
            : undefined
        }
        button={card.button ?? undefined}
        ui={ui.structuredCard}
      />
    </div>
  );
}

SiteCarouselItem.displayName = "SiteCarouselItem";
