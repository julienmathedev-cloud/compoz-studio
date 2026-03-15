/**
 * @file packages/core/src/domain/pages/entities/cells/case-study-card.ts
 * @layer core/domain/pages
 * @description
 * Entités métier liées à la cellule CaseStudyCard.
 *
 * @remarks
 * - La cellule `caseStudyCard` ne porte plus directement un contenu solo.
 * - Elle devient un conteneur de layout avec :
 *   - des options de grille (`columns`)
 *   - une liste homogène d’items (`items`)
 * - Cela permet :
 *   - un usage solo avec `items.length = 1`
 *   - un usage en grille
 *   - une future réutilisation dans un carousel / slider
 */

import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image";

/**
 * Colonnes autorisées pour l’affichage d’une liste de case studies.
 */
export type CaseStudyCardColumns = 1 | 2 | 3;

/**
 * Item individuel d’une case study card.
 *
 * @remarks
 * Représente le contenu métier d’une carte unique.
 */
export type CaseStudyCardItem = {
  id: string;
  image?: ImageEditor;
  title: string;
  context: string;
  solution: string;
  result: string;
};

/**
 * Cellule de type `caseStudyCard`.
 *
 * @remarks
 * Cette cellule porte uniquement :
 * - l’identité de la cellule
 * - son type
 * - ses options de layout
 * - la liste des items à afficher
 */
export type CaseStudyCardCell = {
  id: string;
  kind: "caseStudyCard";
  columns: CaseStudyCardColumns;
  items: CaseStudyCardItem[];
};
