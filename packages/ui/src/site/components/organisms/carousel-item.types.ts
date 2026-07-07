/**
 * @file packages/ui/src/site/components/organisms/carousel-item.types.ts
 * @layer ui/site/components/organisms
 *
 * @description
 * Defines serializable normalized item types shared by carousel and slider renderers.
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

export type NormalizedExtendedCardItem = Readonly<{
  kind: "extendedCard";
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
  button?: Readonly<{
    label: string;
    href: string;
    variant?: "default" | "secondary" | "outline" | "ghost";
  }>;
}>;

export type NormalizedCarouselItem =
  | NormalizedImageItem
  | NormalizedCardItem
  | NormalizedExtendedCardItem
  | NormalizedStructuredCardItem;
