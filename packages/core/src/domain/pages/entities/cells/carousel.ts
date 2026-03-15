/**
 * @file packages/core/src/domain/pages/entities/cells/carousel.ts
 * @layer core/domain/pages
 * @description
 * Entités métier liées à la cellule Carousel.
 *
 * @remarks
 * - La cellule `carousel` porte le cadre d’affichage :
 *   - variante visuelle
 *   - options d’interaction
 *   - type homogène d’items
 * - Les contenus sont stockés dans `items`.
 * - Le carousel ne rend pas des cells arbitraires :
 *   seuls certains types d’items sont autorisés.
 */

import type { CardItem } from "@compoz/core/domain/pages/entities/cells/cards";
import type { CardsExtendedItem } from "@compoz/core/domain/pages/entities/cells/cards-extended";
import type { CaseStudyCardItem } from "@compoz/core/domain/pages/entities/cells/case-study-card";
import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image";

/**
 * Variantes visuelles supportées par la cellule carousel.
 */
export type CarouselVariant = "carousel" | "slider";

/**
 * Types d’items autorisés dans le carousel.
 *
 * @remarks
 * Le carousel rend une liste homogène d’items :
 * tous les items d’une même cellule doivent partager le même `itemKind`.
 */
export type CarouselItemKind =
  | "image"
  | "card"
  | "cardsExtended"
  | "caseStudyCard";

/**
 * Item image pour le carousel.
 */
export type CarouselImageItem = ImageEditor;

/**
 * Union des items autorisés dans un carousel.
 */
export type CarouselItem =
  | CarouselImageItem
  | CardItem
  | CardsExtendedItem
  | CaseStudyCardItem;

/**
 * Cellule de type `carousel`.
 *
 * @remarks
 * - `variant` pilote le comportement visuel global.
 * - `itemKind` indique le type homogène de contenu rendu.
 * - `items` contient les données à afficher dans les slides.
 */
export type CarouselCell = {
  id: string;
  kind: "carousel";
  variant: CarouselVariant;
  showDots: boolean;
  showArrows: boolean;
  itemKind: CarouselItemKind;
  items: ReadonlyArray<CarouselItem>;
};
