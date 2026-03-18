/**
 * @file packages/core/src/domain/pages/entities/cells/structured-card.ts
 * @layer core/domain/pages
 * @description
 * Entités métier liées à la cellule StructuredCard.
 *
 * @remarks
 * - La cellule `structuredCard` est une carte générique structurée.
 * - Elle porte :
 *   - des options de grille (`columns`)
 *   - une liste homogène d’items (`items`)
 * - Chaque item peut contenir :
 *   - une image optionnelle
 *   - un titre
 *   - un meta optionnel
 *   - une liste de sections label/content
 * - Cela permet :
 *   - un usage solo avec `items.length = 1`
 *   - un usage en grille
 *   - une future réutilisation dans un carousel / slider
 */

import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image";

/**
 * Colonnes autorisées pour l’affichage d’une liste de structured cards.
 */
export type StructuredCardColumns = 1 | 2 | 3;

/**
 * Section individuelle d’une structured card.
 *
 * @remarks
 * Représente un bloc de contenu générique affiché dans la carte.
 */
export type StructuredCardSection = {
  id: string;
  label: string;
  content: string;
};

/**
 * Item individuel d’une structured card.
 *
 * @remarks
 * Représente le contenu métier d’une carte unique.
 */
export type StructuredCardItem = {
  id: string;
  image: ImageEditor | null;
  title: string;
  meta: string | null;
  sections: ReadonlyArray<StructuredCardSection>;
};

/**
 * Cellule de type `structuredCard`.
 *
 * @remarks
 * Cette cellule porte uniquement :
 * - l’identité de la cellule
 * - son type
 * - ses options de layout
 * - la liste des items à afficher
 */
export type StructuredCardCell = {
  id: string;
  kind: "structuredCard";
  columns: StructuredCardColumns;
  reveal: boolean;
  items: ReadonlyArray<StructuredCardItem>;
};
