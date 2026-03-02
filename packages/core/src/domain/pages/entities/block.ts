/**
 * @file packages/core/src/domain/pages/entities/block.ts
 * @layer core/domain
 * @description
 * Entités métier représentant les blocks qui composent une page.
 *
 * Invariants (rappel) :
 * - un block est une unité de contenu persistée (pas un composant React),
 * - la forme canonique (types) est définie ici,
 * - pas de defaults (voir `defaults/*` si applicable),
 * - pas de validation Zod (voir `validation/*`),
 * - pas de logique métier (voir `use-cases`).
 */

import type { Cell } from "@compoz/core/domain/pages/entities/cell";

export type BlockId = string;

/**
 * Liste des types de blocks supportés.
 *
 * V0.5 : un seul block est supporté.
 */
export type BlockType = "layoutSection";

/**
 * Layout d’une section : nombre de colonnes (V0.5).
 */
export type LayoutSectionLayout = {
  /** Nombre de colonnes (1 à 3). */
  columns: 1 | 2 | 3;
};

/**
 * Titre optionnel d’une section.
 */
export type LayoutSectionBlockTitle = {
  /** Texte du titre. */
  text: string;

  /** Affichage du titre : visible ou uniquement pour les lecteurs d’écran. */
  display: "visible" | "sr-only";
};

export type LayoutSectionContainerMode = "contained" | "fullBleed";

/**
 * Block "LayoutSection".
 *
 * @remarks
 * - L’ordre d’affichage est l’ordre du tableau `Page.blocks` (pas de champ `order`).
 * - La validation runtime est assurée par les validators du domaine.
 */
export type LayoutSectionBlock = {
  /** Identifiant unique du block. */
  id: BlockId;

  /** Type discriminant. */
  type: "layoutSection";

  /** Layout de la section. */
  layout: LayoutSectionLayout;

  /** Mode de container de la section (layout global). */
  containerMode: LayoutSectionContainerMode;

  titleEnabled: boolean;

  /** Titre de la section (toujours présent). L’affichage est piloté par `titleEnabled`. */
  title: LayoutSectionBlockTitle;

  lcpPriority: boolean;

  /**
   * Cells rendues dans la section.
   *
   * Invariant (domaine) : `cells.length === layout.columns`.
   */
  cells: ReadonlyArray<Cell>;
};

export type Block = LayoutSectionBlock;
