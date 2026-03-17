/**
 * @file packages/ui/src/site/components/organisms/carousel-item.types.ts
 * @layer ui/site/components
 *
 * @description
 * Types sérialisables partagés pour le rendu des items de carousel / slider.
 */

export type NormalizedImageItem = Readonly<{
  kind: "image";
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}>;

export type NormalizedCardItem = Readonly<{
  kind: "card";
  id: string;
  title: string;
  description: string;
  icon?: string;
}>;

export type NormalizedCardsExtendedItem = Readonly<{
  kind: "cardsExtended";
  id: string;
  title: string;
  description: string;
  bullets: string[];
  footer?: string;
  icon?: string;
}>;

export type NormalizedStructuredCardItem = Readonly<{
  kind: "structuredCard";
  id: string;
  title: string;
  meta?: string;
  sections: ReadonlyArray<
    Readonly<{
      label: string;
      content: string;
    }>
  >;
  image?: Readonly<{
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  }>;
}>;

export type NormalizedCarouselItem =
  | NormalizedImageItem
  | NormalizedCardItem
  | NormalizedCardsExtendedItem
  | NormalizedStructuredCardItem;
